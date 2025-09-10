/* @flow */
import { exec, execSync, execFile } from 'child_process';
import { createHash } from 'crypto';

let { platform }: Object = process,
    guid: Object = {
        darwin: 'ioreg -rd1 -c IOPlatformExpertDevice',
        win32: 'powershell',
        linux: '( cat /var/lib/dbus/machine-id /etc/machine-id 2> /dev/null || hostname ) | head -n 1 || :',
        freebsd: 'kenv -q smbios.system.uuid || sysctl -n kern.hostuuid'
    };



function hash(guid: string): string {
    return createHash('sha256').update(guid).digest('hex');
}

function expose(result: string): string {
    switch (platform) {
        case 'darwin':
            return result
                .split('IOPlatformUUID')[1]
                .split('\n')[0].replace(/\=|\s+|\"/ig, '')
                .toLowerCase();
        case 'win32':
            return result
                .toString()
                .trim()
                .toLowerCase();
        case 'linux':
            return result
                .toString()
                .replace(/\r+|\n+|\s+/ig, '')
                .toLowerCase();
        case 'freebsd':
            return result
                .toString()
                .replace(/\r+|\n+|\s+/ig, '')
                .toLowerCase();
        default:
            throw new Error(`Unsupported platform: ${process.platform}`);
    }
}

export function machineIdSync(original: boolean): string {
    let id: string;
    if (platform === 'win32') {
        const result = execSync('powershell.exe -NoProfile -Command "(Get-ItemProperty -Path \'HKLM:\\SOFTWARE\\Microsoft\\Cryptography\' -Name MachineGuid).MachineGuid"', { windowsHide: true });
        id = expose(result.toString());
    } else {
        id = expose(execSync(guid[platform]).toString());
    }
    return original ? id : hash(id);
}

export function machineId(original: boolean): Promise<string> {
    return new Promise((resolve: Function, reject: Function): Object => {
        if (platform === 'win32') {
            return execFile('powershell.exe', [
                '-NoProfile',
                '-Command',
                '(Get-ItemProperty -Path \'HKLM:\\SOFTWARE\\Microsoft\\Cryptography\' -Name MachineGuid).MachineGuid'
            ], { windowsHide: true }, (err: any, stdout: any) => {
                if (err) {
                    return reject(
                        new Error(`Error while obtaining machine id: ${err.stack}`)
                    );
                }
                let id: string = expose(stdout.toString());
                return resolve(original ? id : hash(id));
            });
        } else {
            return exec(guid[platform], {}, (err: any, stdout: any, stderr: any) => {
                if (err) {
                    return reject(
                        new Error(`Error while obtaining machine id: ${err.stack}`)
                    );
                }
                let id: string = expose(stdout.toString());
                return resolve(original ? id : hash(id));
            });
        }
    });
}
