# .env에서 JAVA_HOME을 읽어 현재 세션에 적용한 뒤 bootRun 실행
$projectRoot = Join-Path $PSScriptRoot ".."
$envFile = Join-Path $projectRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '=' } | ForEach-Object {
        $line = $_ -replace "`r", ""
        $idx  = $line.IndexOf('=')
        $key  = $line.Substring(0, $idx).Trim()
        $val  = $line.Substring($idx + 1).Trim()
        [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
    }
}

$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
Write-Host "JAVA_HOME = $env:JAVA_HOME"

Push-Location $projectRoot
try {
    & ".\gradlew.bat" bootRun
} finally {
    Pop-Location
}
