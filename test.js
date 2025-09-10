const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

// Test function for PowerShell approach
async function testPowerShellMachineGuid() {
    console.log('Testing PowerShell machine GUID retrieval...');
    console.log('Platform:', process.platform);
    
    if (process.platform !== 'win32') {
        console.log('❌ This test is only for Windows platforms');
        return;
    }

    try {
        // Test the PowerShell approach
        console.log('\n🔍 Testing PowerShell approach...');
        
        const { stdout, stderr } = await execFileAsync('powershell.exe', [
            '-NoProfile',
            '-Command',
            '(Get-ItemProperty -Path \'HKLM:\\SOFTWARE\\Microsoft\\Cryptography\' -Name MachineGuid).MachineGuid'
        ], { 
            windowsHide: true,
            timeout: 10000 // 10 second timeout
        });

        if (stderr) {
            console.log('⚠️  PowerShell stderr:', stderr);
        }

        const machineGuid = stdout.trim();
        console.log('✅ PowerShell result:', machineGuid);
        
        // Validate GUID format
        const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (guidPattern.test(machineGuid)) {
            console.log('✅ GUID format is valid');
        } else {
            console.log('❌ GUID format is invalid');
        }

        // Compare with current REG.exe approach
        console.log('\n🔍 Testing current REG.exe approach for comparison...');
        
        const regCommand = process.arch === 'ia32' && process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432') 
            ? '%windir%\\sysnative\\cmd.exe /c %windir%\\System32\\REG.exe'
            : '%windir%\\System32\\REG.exe';
            
        const { stdout: regStdout } = await execFileAsync('cmd.exe', [
            '/c',
            `${regCommand} QUERY HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid`
        ], { 
            windowsHide: true,
            timeout: 10000
        });

        // Extract GUID from REG output
        const regGuid = regStdout
            .toString()
            .split('REG_SZ')[1]
            .replace(/\r+|\n+|\s+/ig, '')
            .toLowerCase();

        console.log('✅ REG.exe result:', regGuid);
        
        // Compare results
        if (machineGuid.toLowerCase() === regGuid.toLowerCase()) {
            console.log('✅ Both methods return the same GUID - PowerShell approach works correctly!');
        } else {
            console.log('❌ Methods return different GUIDs:');
            console.log('   PowerShell:', machineGuid.toLowerCase());
            console.log('   REG.exe:   ', regGuid.toLowerCase());
        }

    } catch (error) {
        console.error('❌ Error during test:', error.message);
        if (error.code) {
            console.error('   Error code:', error.code);
        }
        if (error.signal) {
            console.error('   Signal:', error.signal);
        }
    }
}

// Test function using callback style (like in your example)
function testPowerShellCallback() {
    console.log('\n🔍 Testing PowerShell with callback style...');
    
    return new Promise((resolve, reject) => {
        execFile('powershell.exe', [
            '-NoProfile',
            '-Command',
            '(Get-ItemProperty -Path \'HKLM:\\SOFTWARE\\Microsoft\\Cryptography\' -Name MachineGuid).MachineGuid'
        ], { windowsHide: true }, (err, stdout) => {
            if (err) {
                console.error('❌ Callback style error:', err.message);
                reject(err);
            } else {
                const result = stdout.trim();
                console.log('✅ Callback style result:', result);
                resolve(result);
            }
        });
    });
}

// Run the tests
async function runTests() {
    console.log('='.repeat(60));
    console.log('Windows Machine GUID PowerShell Test');
    console.log('='.repeat(60));
    
    try {
        await testPowerShellMachineGuid();
        await testPowerShellCallback();
        
        console.log('\n' + '='.repeat(60));
        console.log('Test completed successfully!');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = { testPowerShellMachineGuid, testPowerShellCallback };
