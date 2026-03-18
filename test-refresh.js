import fs from 'fs';

async function testRefreshTokenFlow() {
    const randomEmail = `test_${Date.now()}@example.com`;

    console.log(`0. Registering user ${randomEmail}...`);
    const regRes = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', email: randomEmail, password: 'password123', phone: '1234567890' })
    });
    console.log('Register Response:', await regRes.json());

    console.log('\n1. Logging in to get a refresh token...');

    // We will use the devdangi user or just create a random one
    const loginRes = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: randomEmail, password: 'password123' })
    });

    const loginData = await loginRes.json();
    console.log('Login Response:', JSON.stringify(loginData, null, 2));

    if (!loginData.success) {
        console.error('Login failed, cannot test refresh token');
        return;
    }

    const refreshToken = loginData.data.refreshToken;
    console.log('\n2. Testing Refresh Token API with the obtained token...');

    const refreshRes = await fetch('http://localhost:3000/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: refreshToken })
    });

    const refreshData = await refreshRes.json();
    console.log('Refresh Response:', JSON.stringify(refreshData, null, 2));

    const finalOutput = {
        login: loginData,
        refresh: refreshData
    };
    fs.writeFileSync('test-refresh-result.json', JSON.stringify(finalOutput, null, 2));
}

testRefreshTokenFlow();
