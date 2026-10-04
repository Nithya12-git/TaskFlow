# TaskFlow API smoke test.
# Needs the backend running and the demo data seeded:
#   npx prisma db seed
#   .\scripts\smoke-test.ps1

$Base = "http://localhost:4000/api"
$script:Pass = 0
$script:Fail = 0

function Call {
  param($Method, $Path, $Session = $null, $Body = $null)
  $p = @{ Uri = "$Base$Path"; Method = $Method; UseBasicParsing = $true; ContentType = "application/json" }
  if ($Session) { $p.WebSession = $Session }
  if ($null -ne $Body) { $p.Body = ($Body | ConvertTo-Json -Depth 5) }
  $status = 0
  $content = ""
  try {
    $r = Invoke-WebRequest @p
    $status = [int]$r.StatusCode
    $content = $r.Content
  } catch {
    if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
    $content = $_.ErrorDetails.Message
  }
  $json = $null
  if ($content) { try { $json = $content | ConvertFrom-Json } catch { } }
  [pscustomobject]@{ Status = $status; Json = $json; Raw = "$content" }
}

function Check($Name, $Condition) {
  if ($Condition) { $script:Pass++; Write-Host "  PASS  $Name" -ForegroundColor Green }
  else { $script:Fail++; Write-Host "  FAIL  $Name" -ForegroundColor Red }
}

function NewSession { New-Object Microsoft.PowerShell.Commands.WebRequestSession }

function Login($Email) {
  $s = NewSession
  $r = Call "POST" "/auth/login" $s @{ email = $Email; password = "Password123!" }
  if ($r.Status -ne 200) {
    Write-Host "Cannot log in as $Email (status $($r.Status)). Re-seed the database with: npx prisma db seed" -ForegroundColor Yellow
    exit 1
  }
  return $s
}

Write-Host ""
Write-Host "Health and authentication"
Check "health endpoint responds" ((Call "GET" "/health").Status -eq 200)
Check "unauthenticated /auth/me is rejected (401)" ((Call "GET" "/auth/me").Status -eq 401)
Check "unauthenticated /projects is rejected (401)" ((Call "GET" "/projects").Status -eq 401)
Check "unauthenticated /tasks is rejected (401)" ((Call "GET" "/tasks").Status -eq 401)
Check "unauthenticated /team is rejected (401)" ((Call "GET" "/team").Status -eq 401)
Check "unauthenticated /billing is rejected (401)" ((Call "GET" "/billing").Status -eq 401)
Check "wrong password is rejected (401)" ((Call "POST" "/auth/login" $null @{ email = "owner@taskflow.dev"; password = "wrong" }).Status -eq 401)
Check "unknown email is rejected (401)" ((Call "POST" "/auth/login" $null @{ email = "nobody@example.com"; password = "Password123!" }).Status -eq 401)
Check "weak password is rejected on register (400)" ((Call "POST" "/auth/register" $null @{ name = "Weak User"; email = "weak@example.com"; password = "abc"; workspaceName = "Weak Inc" }).Status -eq 400)
Check "duplicate email is rejected on register (409)" ((Call "POST" "/auth/register" $null @{ name = "Dup User"; email = "owner@taskflow.dev"; password = "Password123!"; workspaceName = "Dup Inc" }).Status -eq 409)

$owner = Login "owner@taskflow.dev"
$admin = Login "admin@taskflow.dev"
$member = Login "member@taskflow.dev"
$guest = Login "guest@taskflow.dev"

$me = Call "GET" "/auth/me" $owner
Check "owner session reports OWNER" ($me.Json.role -eq "OWNER")
Check "guest session reports GUEST" ((Call "GET" "/auth/me" $guest).Json.role -eq "GUEST")
Check "password is never returned" (-not $me.Raw.Contains("password"))

Write-Host ""
Write-Host "Projects (RBAC and validation)"
Check "guest can list projects (200)" ((Call "GET" "/projects" $guest).Status -eq 200)
Check "guest cannot create a project (403)" ((Call "POST" "/projects" $guest @{ name = "Nope" }).Status -eq 403)
Check "member cannot create a project (403)" ((Call "POST" "/projects" $member @{ name = "Nope" }).Status -eq 403)
$p = Call "POST" "/projects" $admin @{ name = "Smoke Project" }
Check "admin can create a project (201)" ($p.Status -eq 201)
$projectId = $p.Json.id
Check "admin can update a project (200)" ((Call "PUT" "/projects/$projectId" $admin @{ name = "Smoke Project 2" }).Status -eq 200)
Check "member cannot update a project (403)" ((Call "PUT" "/projects/$projectId" $member @{ name = "Hacked" }).Status -eq 403)
Check "admin cannot delete a project (403)" ((Call "DELETE" "/projects/$projectId" $admin).Status -eq 403)
Check "empty project name is rejected (400)" ((Call "POST" "/projects" $admin @{ name = "" }).Status -eq 400)
Check "invalid project status is rejected (400)" ((Call "POST" "/projects" $admin @{ name = "Bad Status"; status = "WHATEVER" }).Status -eq 400)
Check "unknown project returns 404" ((Call "GET" "/projects/does-not-exist" $owner).Status -eq 404)

Write-Host ""
Write-Host "Tasks (RBAC, assignment and validation)"
$memberId = (Call "GET" "/auth/me" $member).Json.user.id
Check "guest can list tasks (200)" ((Call "GET" "/tasks" $guest).Status -eq 200)
Check "guest cannot create a task (403)" ((Call "POST" "/tasks" $guest @{ projectId = $projectId; title = "Nope task" }).Status -eq 403)
$t = Call "POST" "/tasks" $member @{ projectId = $projectId; title = "Smoke task"; priority = "HIGH"; assignedTo = $memberId }
Check "member can create and assign a task (201)" ($t.Status -eq 201)
$taskId = $t.Json.id
Check "assignee is saved" ($t.Json.assignee.name -eq "Maya Member")
Check "member can update task status (200)" ((Call "PUT" "/tasks/$taskId" $member @{ status = "COMPLETED" }).Status -eq 200)
Check "guest cannot update a task (403)" ((Call "PUT" "/tasks/$taskId" $guest @{ status = "TODO" }).Status -eq 403)
Check "member cannot delete a task (403)" ((Call "DELETE" "/tasks/$taskId" $member).Status -eq 403)
Check "cannot assign to a non-member (400)" ((Call "PUT" "/tasks/$taskId" $admin @{ assignedTo = "not-a-real-user" }).Status -eq 400)
Check "invalid task status is rejected (400)" ((Call "PUT" "/tasks/$taskId" $admin @{ status = "DONE" }).Status -eq 400)
Check "task title too short is rejected (400)" ((Call "POST" "/tasks" $member @{ projectId = $projectId; title = "x" }).Status -eq 400)
Check "task in unknown project is rejected (404)" ((Call "POST" "/tasks" $member @{ projectId = "nope"; title = "Orphan task" }).Status -eq 404)
Check "overdue filter returns results (200)" ((Call "GET" "/tasks?overdue=true" $owner).Status -eq 200)

Write-Host ""
Write-Host "Team rules"
$email = "smoke-" + [guid]::NewGuid().ToString("N").Substring(0, 8) + "@example.com"
Check "member cannot add team members (403)" ((Call "POST" "/team" $member @{ name = "Some One"; email = "m-$email"; password = "Password123!"; role = "MEMBER" }).Status -eq 403)
Check "admin cannot add an admin (403)" ((Call "POST" "/team" $admin @{ name = "Some Admin"; email = "a-$email"; password = "Password123!"; role = "ADMIN" }).Status -eq 403)
$n = Call "POST" "/team" $admin @{ name = "Smoke Newbie"; email = $email; password = "Password123!"; role = "MEMBER" }
Check "admin can add a member (201)" ($n.Status -eq 201)
$newMemberId = $n.Json.id
Check "duplicate team email is rejected (409)" ((Call "POST" "/team" $admin @{ name = "Smoke Again"; email = $email; password = "Password123!"; role = "MEMBER" }).Status -eq 409)
$team = (Call "GET" "/team" $owner).Json
$ownerRow = $team | Where-Object { $_.role -eq "OWNER" }
$adminRow = $team | Where-Object { $_.role -eq "ADMIN" }
Check "admin cannot change the owner's role (403)" ((Call "PUT" "/team/$($ownerRow.id)" $admin @{ role = "MEMBER" }).Status -eq 403)
Check "owner's role cannot be changed (403)" ((Call "PUT" "/team/$($ownerRow.id)" $owner @{ role = "MEMBER" }).Status -eq 403)
Check "owner cannot be removed (403)" ((Call "DELETE" "/team/$($ownerRow.id)" $owner).Status -eq 403)
Check "nobody can be promoted to OWNER (400)" ((Call "PUT" "/team/$newMemberId" $owner @{ role = "OWNER" }).Status -eq 400)
Check "admin cannot change their own role (400)" ((Call "PUT" "/team/$($adminRow.id)" $admin @{ role = "MEMBER" }).Status -eq 400)
$a2 = Call "POST" "/team" $owner @{ name = "Smoke Admin"; email = "adm-$email"; password = "Password123!"; role = "ADMIN" }
Check "owner can add an admin (201)" ($a2.Status -eq 201)
Check "admin cannot change another admin (403)" ((Call "PUT" "/team/$($a2.Json.id)" $admin @{ role = "MEMBER" }).Status -eq 403)
Check "admin cannot remove another admin (403)" ((Call "DELETE" "/team/$($a2.Json.id)" $admin).Status -eq 403)
Check "owner can remove the smoke admin (204)" ((Call "DELETE" "/team/$($a2.Json.id)" $owner).Status -eq 204)
Check "member cannot change roles (403)" ((Call "PUT" "/team/$newMemberId" $member @{ role = "GUEST" }).Status -eq 403)
Check "admin can change a member's role (200)" ((Call "PUT" "/team/$newMemberId" $admin @{ role = "GUEST" }).Status -eq 200)

Write-Host ""
Write-Host "Settings, billing and dashboard"
Check "member cannot rename the workspace (403)" ((Call "PUT" "/settings/workspace" $member @{ name = "Hacked" }).Status -eq 403)
Check "guest cannot rename the workspace (403)" ((Call "PUT" "/settings/workspace" $guest @{ name = "Hacked" }).Status -eq 403)
Check "admin cannot view billing (403)" ((Call "GET" "/billing" $admin).Status -eq 403)
Check "member cannot view billing (403)" ((Call "GET" "/billing" $member).Status -eq 403)
Check "owner can view billing (200)" ((Call "GET" "/billing" $owner).Status -eq 200)
Check "wrong current password is rejected (400)" ((Call "PUT" "/settings/password" $owner @{ currentPassword = "wrong"; newPassword = "Password456!" }).Status -eq 400)
Check "dashboard stats load for a guest (200)" ((Call "GET" "/dashboard/stats" $guest).Status -eq 200)
Check "activity feed loads for a guest (200)" ((Call "GET" "/activity?limit=5" $guest).Status -eq 200)

Write-Host ""
Write-Host "Tenant isolation"
$outsiderEmail = "outsider-" + [guid]::NewGuid().ToString("N").Substring(0, 8) + "@example.com"
$outsider = NewSession
$reg = Call "POST" "/auth/register" $outsider @{ name = "Eve Outsider"; email = $outsiderEmail; password = "Password123!"; workspaceName = "Outsider Inc" }
Check "a separate workspace can be registered (201)" ($reg.Status -eq 201)
Check "outsider is OWNER of their own workspace only" ($reg.Json.role -eq "OWNER" -and $reg.Json.workspace.name -eq "Outsider Inc")
Check "outsider sees no projects" ((Call "GET" "/projects" $outsider).Raw.Trim() -eq "[]")
Check "outsider sees no tasks" ((Call "GET" "/tasks" $outsider).Raw.Trim() -eq "[]")
Check "outsider cannot read a TaskFlow Core project (404)" ((Call "GET" "/projects/$projectId" $outsider).Status -eq 404)
Check "outsider cannot update it (404)" ((Call "PUT" "/projects/$projectId" $outsider @{ name = "Stolen" }).Status -eq 404)
Check "outsider cannot delete it (404)" ((Call "DELETE" "/projects/$projectId" $outsider).Status -eq 404)
Check "outsider cannot read a TaskFlow Core task (404)" ((Call "GET" "/tasks/$taskId" $outsider).Status -eq 404)
Check "outsider cannot update that task (404)" ((Call "PUT" "/tasks/$taskId" $outsider @{ status = "TODO" }).Status -eq 404)
Check "outsider cannot delete that task (404)" ((Call "DELETE" "/tasks/$taskId" $outsider).Status -eq 404)
Check "outsider cannot create a task in it (404)" ((Call "POST" "/tasks" $outsider @{ projectId = $projectId; title = "Sneaky task" }).Status -eq 404)
Check "outsider cannot edit a TaskFlow Core member (404)" ((Call "PUT" "/team/$newMemberId" $outsider @{ role = "ADMIN" }).Status -eq 404)
Check "outsider cannot remove a TaskFlow Core member (404)" ((Call "DELETE" "/team/$newMemberId" $outsider).Status -eq 404)
Check "outsider sees only themselves on the team" (@((Call "GET" "/team" $outsider).Json).Count -eq 1)
Check "outsider dashboard is empty" ((Call "GET" "/dashboard/stats" $outsider).Json.stats.totalTasks -eq 0)
Check "outsider activity only shows their own events" (@((Call "GET" "/activity" $outsider).Json).Count -eq 1)

Write-Host ""
Write-Host "Cleanup"
Check "admin can delete the smoke task (204)" ((Call "DELETE" "/tasks/$taskId" $admin).Status -eq 204)
Check "owner can delete the smoke project (204)" ((Call "DELETE" "/projects/$projectId" $owner).Status -eq 204)
Check "owner can remove the smoke member (204)" ((Call "DELETE" "/team/$newMemberId" $owner).Status -eq 204)

Write-Host ""
$color = "Green"
if ($script:Fail -gt 0) { $color = "Red" }
Write-Host "Passed: $($script:Pass)   Failed: $($script:Fail)" -ForegroundColor $color
Write-Host "Note: the 'Outsider Inc' test workspace stays in the database. Run 'npx prisma db seed' to reset."
if ($script:Fail -gt 0) { exit 1 }