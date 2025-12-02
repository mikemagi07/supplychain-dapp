# PowerShell script to set up MetaMask accounts environment variable
# Usage: .\scripts\setup-metamask-accounts.ps1
# 
# ============================================================================
# WHERE TO PLACE YOUR METAMASK ADDRESSES:
# ============================================================================
# 
# Option 1: Edit the config file (RECOMMENDED for permanent setup)
#   File: scripts/config/metamask-addresses.js
#   Edit the DEFAULT_METAMASK_ADDRESSES array (lines 5-21)
#   Replace the addresses with your MetaMask account addresses
#
# Option 2: Set environment variable (for temporary/session use)
#   $env:METAMASK_ADDRESSES="0x...,0x...,0x..."
#
# Option 3: Use this script (reads from config file automatically)
#   .\scripts\setup-metamask-accounts.ps1
# ============================================================================

# Read addresses from config file
$configPath = Join-Path $PSScriptRoot "config\metamask-addresses.js"
if (Test-Path $configPath) {
    $configContent = Get-Content $configPath -Raw
    # Extract addresses from DEFAULT_METAMASK_ADDRESSES array
    if ($configContent -match 'DEFAULT_METAMASK_ADDRESSES\s*=\s*\[(.*?)\]' -or 
        $configContent -match 'const DEFAULT_METAMASK_ADDRESSES\s*=\s*\[(.*?)\]') {
        $addressesBlock = $matches[1]
        $addresses = [regex]::Matches($addressesBlock, '0x[a-fA-F0-9]{40}') | ForEach-Object { $_.Value }
        $accountsString = $addresses -join ","
    } else {
        Write-Host "⚠️  Could not parse addresses from config file. Using hardcoded defaults." -ForegroundColor Yellow
        # Fallback to hardcoded addresses
        $metamaskAccounts = @(
            "0x7d0a9c42b9953a1adc0a8a15a6a66bb489994e57",
            "0x44da5566ef04234363b4882d856d590ab435096e",
            "0x933d4350bca858e6de702a929878a413352885d8",
            "0x2fa965d296f182848588f9a3ed97af2e9fdf2d76",
            "0xb6ce9af39c7ca87f179666c05204d72516649dfc",
            "0x5560e14d290bc0459ca186b647637238dde2cdfb",
            "0x8567da95c79efcd36f953478d4f3adec117ae179",
            "0x24dc4ef5604ee51c616c1a7f42906f44cf196afe",
            "0xE5A1385f95ACd5caD8192fb82F13F065aeBA86Cc",
            "0xd51c949838f9e35851b5c9be3f6309101b0687c2",
            "0x984e3ea2679d8febc93d0c885712158debcef02e",
            "0x171c52193664A2c624c5551C442A8bbde2D3a93e",
            "0xc693c588981179b5e3f951e12c38e74ea6082d1c",
            "0x34e817073401aaa0f21215d769cd9e3500b2e69e",
            "0x423536d127f738b31999b2259d1ff842c2d47080"
        )
        $accountsString = $metamaskAccounts -join ","
    }
} else {
    Write-Host "⚠️  Config file not found. Using hardcoded defaults." -ForegroundColor Yellow
    $metamaskAccounts = @(
        "0x7d0a9c42b9953a1adc0a8a15a6a66bb489994e57",
        "0x44da5566ef04234363b4882d856d590ab435096e",
        "0x933d4350bca858e6de702a929878a413352885d8",
        "0x2fa965d296f182848588f9a3ed97af2e9fdf2d76",
        "0xb6ce9af39c7ca87f179666c05204d72516649dfc",
        "0x5560e14d290bc0459ca186b647637238dde2cdfb",
        "0x8567da95c79efcd36f953478d4f3adec117ae179",
        "0x24dc4ef5604ee51c616c1a7f42906f44cf196afe",
        "0xE5A1385f95ACd5caD8192fb82F13F065aeBA86Cc",
        "0xd51c949838f9e35851b5c9be3f6309101b0687c2",
        "0x984e3ea2679d8febc93d0c885712158debcef02e",
        "0x171c52193664A2c624c5551C442A8bbde2D3a93e",
        "0xc693c588981179b5e3f951e12c38e74ea6082d1c",
        "0x34e817073401aaa0f21215d769cd9e3500b2e69e",
        "0x423536d127f738b31999b2259d1ff842c2d47080"
    )
    $accountsString = $metamaskAccounts -join ","
}
$env:METAMASK_ADDRESSES = $accountsString

Write-Host "✅ MetaMask accounts environment variable set!" -ForegroundColor Green
Write-Host "   Total accounts: $($metamaskAccounts.Count)" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Addresses were read from: scripts/config/metamask-addresses.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now run:" -ForegroundColor Yellow
Write-Host "   npm start" -ForegroundColor White
Write-Host "   or" -ForegroundColor Yellow
Write-Host "   npm run deploy:localhost" -ForegroundColor White
Write-Host ""
Write-Host "💡 To use different addresses:" -ForegroundColor Yellow
Write-Host "   1. Edit: scripts/config/metamask-addresses.js (lines 5-21)" -ForegroundColor White
Write-Host "   2. Or set: `$env:METAMASK_ADDRESSES=`"0x...,0x...`"" -ForegroundColor White
Write-Host ""
Write-Host "To make this permanent, add to your PowerShell profile:" -ForegroundColor Yellow
Write-Host "   `$env:METAMASK_ADDRESSES = `"$accountsString`"" -ForegroundColor White

