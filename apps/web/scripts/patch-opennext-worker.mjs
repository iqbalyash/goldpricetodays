import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const templatePath = join(
  dirname(require.resolve("@opennextjs/cloudflare/package.json")),
  "dist/cli/templates/worker.js",
);

const marker = "async scheduled(_event, env, ctx)";
const source = readFileSync(templatePath, "utf8");

if (source.includes(marker)) {
  process.exit(0);
}

const needle = `            return handler(reqOrResp, env, ctx, request.signal);
        });
    },
};`;

const scheduled = `            return handler(reqOrResp, env, ctx, request.signal);
        });
    },
    async scheduled(_event, env, ctx) {
        const secret = env.CRON_SECRET;
        if (!secret) {
            console.error("CRON_SECRET is not set; skipping the gold price update.");
            return;
        }
        const request = new Request("https://goldpricetodays.com/api/cron/update-prices", {
            method: "GET",
            headers: { authorization: \`Bearer \${secret}\` },
        });
        ctx.waitUntil(this.fetch(request, env, ctx).then(async (response) => {
            if (!response.ok) {
                console.error("Gold price cron failed", response.status, await response.text());
            }
        }));
    },
};`;

if (!source.includes(needle)) {
  throw new Error(`Could not patch ${templatePath}. The OpenNext worker template changed.`);
}

writeFileSync(templatePath, source.replace(needle, scheduled));
