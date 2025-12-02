import { createMailAccount } from "../functions/mailaccounts.ts";

import readline from "readline/promises";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

(async () => {
    const userId = await rl.question("Enter user id: ");
    const address = await rl.question("Enter address: ");
    const domainId = await rl.question("Enter domain id: ");
    const color = await rl.question("Enter color: ");
    const organizationId = await rl.question("Enter organization id: ");
    await createMailAccount({
        userId,
        address,
        domainId,
        color,
        organizationId
    });
    rl.close();
})();
