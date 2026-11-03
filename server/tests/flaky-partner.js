const express = require('express');
const app = express();

let mode = 'ok'; // ok, flaky, error, slow
let calls = 0;

const tasks = [
    { id: 1, title: 'Write README', dueDate: '2026-11-02', status: 'active' },
    { id: 2, title: 'Ship v1', dueDate: '2026-11-09', status: 'active' },
];
const memberships = [
    { tier: 'Daily Drop-In', price: '500 KES', details: 'Full facility access for 24 hours.' },
    { tier: 'Monthly Standard', price: '5,000 KES', details: 'Unlimited access + GymBuddy App.' },
];

app.get('/', (req, res) => {
    res.json({ status: 'ok', mode });
});

// switch behaviour without restarting: curl http://localhost:4000/__mode/slow
app.get('/__mode/:m', (req, res) => {
    mode = req.params.m;
    calls = 0;
    res.json({ mode });
});

app.get(['/tasks', '/memberships'], async (req, res) => {
    calls += 1;
    console.log(`GET ${req.path} (call ${calls}, mode ${mode})`);
    if (mode === 'slow') { // answers after 10 seconds
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
    if (mode === 'flaky' && calls % 3 !== 0) { // fails twice, then works
        return res.status(503).json({ message: 'Try again' });
    }
    if (mode === 'error') { // always fails
        return res.status(500).json({ message: 'Internal error' });
    }
    res.json(req.path === '/memberships' ? memberships : tasks);
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Stand-in partner on http://localhost:${port}`));
