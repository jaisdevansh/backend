// test-reg.js
fetch('https://backend-5b1c.onrender.com/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'Test Three',
        email: 'test3@example.com',
        password: 'Test@1234',
        phone: '1234567891'
    })
}).then(r => r.json()).then(console.log).catch(console.error);
