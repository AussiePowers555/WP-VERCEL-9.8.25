import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json();
    
    if (!email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }
    
    // Brevo API configuration
    const brevoApiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@pbikerescue.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'PBike Rescue Admin';
    
    if (!brevoApiKey) {
      console.error('Brevo API key not configured');
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 500 }
      );
    }
    
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your PBike Rescue Account Credentials</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .credentials { background: white; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to PBike Rescue</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>An account has been created for you in the PBike Rescue management system with the role: <strong>${role}</strong></p>
            
            <div class="credentials">
                <h3>Your Login Credentials</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> ${password}</p>
            </div>
            
            <p>Please log in using these credentials and change your password immediately for security purposes.</p>
            
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9015'}/login" class="button">
                Log In to PBike Rescue
            </a>
            
            <p><strong>Important Security Notes:</strong></p>
            <ul>
                <li>This is a temporary password - please change it after your first login</li>
                <li>Keep your login credentials secure and do not share them</li>
                <li>If you have any issues accessing your account, contact the administrator</li>
            </ul>
        </div>
        <div class="footer">
            <p>PBike Rescue Management System</p>
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;
    
    // Send email via Brevo
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail
        },
        to: [{
          email: email,
          name: email.split('@')[0]
        }],
        subject: 'Your PBike Rescue Account Credentials',
        htmlContent: emailContent
      })
    });
    
    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();
      console.error('Brevo API error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Credentials email sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending credentials email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}