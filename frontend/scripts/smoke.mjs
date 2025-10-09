const target = process.env.SMOKE_URL || 'http://localhost:5173';

async function run() {
  try {
    const res = await fetch(target, { redirect: 'follow' });
    if (!res.ok) {
      throw new Error(`Non-200 response: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    if (!/<!doctype html>/i.test(text)) {
      throw new Error('Response did not look like HTML');
    }

    console.log(`Smoke test passed for ${target}`);
  } catch (error) {
    console.error(`Smoke test failed for ${target}:`, error.message);
    process.exitCode = 1;
  }
}

run();
