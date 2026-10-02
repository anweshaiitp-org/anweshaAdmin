import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const API_BASE_URL = 'https://xt3pspoxkt.execute-api.localhost.localstack.cloud:4566/prod';

  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error("No authorization token provided. Are you logged in?");
    }

    // STEP 1: REGISTER FOR THE EVENT
    const registerRes = await fetch(`${API_BASE_URL}/registration/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': authHeader 
      },
      body: JSON.stringify({
        event_id: "EVT-003",
        domain: "SOLO_EVENT",
        reference_id: "EVT-003",
        type: "solo"
      })
    });

    const registerData = await registerRes.json().catch(() => ({}));
    
    // If registration fails, check if it's because they are already registered
    if (!registerRes.ok) {
      const errorMsg = JSON.stringify(registerData).toLowerCase();
      if (errorMsg.includes('already') || errorMsg.includes('exists')) {
        console.log("User is already registered for EVT-003. Proceeding to payment...");
      } else {
        throw new Error(`Registration failed (${registerRes.status}): ${JSON.stringify(registerData)}`);
      }
    }

    // STEP 2: INITIATE PAYMENT
    const initiateRes = await fetch(`${API_BASE_URL}/payment/initiate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': authHeader 
      },
      body: JSON.stringify({
        event_id: "EVT-003",
        domain: "SOLO_EVENT",
        reference_id: "EVT-003",
        type: "solo",   
        amount: 200     
      })
    });

    if (!initiateRes.ok) {
      const errorText = await initiateRes.text();
      throw new Error(`Payment initiate failed (${initiateRes.status}): ${errorText}`);
    }
    
    const initiateData = await initiateRes.json();
    return NextResponse.json(initiateData);

  } catch (error: any) {
    console.error("Test Payment Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}