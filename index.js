require("dotenv").config();
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

// Read senders and receivers from files
function readSenders() {
  const sendersPath = path.join(__dirname, "senders.txt");
  const content = fs.readFileSync(sendersPath, "utf-8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function readReceivers() {
  const receiversPath = path.join(__dirname, "receivers.txt");
  const content = fs.readFileSync(receiversPath, "utf-8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function createOAuth2Client(senderIndex) {
  const clientId = process.env[`GOOGLE_CLIENT_ID_${senderIndex}`];
  const clientSecret = process.env[`GOOGLE_CLIENT_SECRET_${senderIndex}`];
  const refreshToken = process.env[`GOOGLE_REFRESH_TOKEN_${senderIndex}`];

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

// Function to create transporter with fresh access token for a specific sender
async function createTransporter(senderEmail, senderIndex) {
  try {
    const oauth2Client = createOAuth2Client(senderIndex);
    
    if (!oauth2Client) {
      throw new Error(
        `Missing OAuth credentials for sender ${senderIndex} (${senderEmail})`
      );
    }

    const { token } = await oauth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: senderEmail,
        clientId: process.env[`GOOGLE_CLIENT_ID_${senderIndex}`],
        clientSecret: process.env[`GOOGLE_CLIENT_SECRET_${senderIndex}`],
        refreshToken: process.env[`GOOGLE_REFRESH_TOKEN_${senderIndex}`],
        accessToken: token,
      },
    });

    return transporter;
  } catch (error) {
    console.error(
      `Error creating transporter for ${senderEmail}:`,
      error.message
    );
    throw error;
  }
}

// Function to send an email
async function sendEmail(fromEmail, fromIndex, to, subject, text, html) {
  try {
    const transporter = await createTransporter(fromEmail, fromIndex);

    const mailOptions = {
      from: fromEmail,
      to: to,
      subject: subject,
      text: text,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Email sent successfully from ${fromEmail} to ${to}:`,
      info.messageId
    );
    return info;
  } catch (error) {
    console.error(`❌ Error sending email from ${fromEmail} to ${to}:`, error.message);
    throw error;
  }
}

// Email content variations to avoid spam detection
const emailContentVariations = [
  {
    text: "Hi there, I came across your GitHub profile and was very impressed by your work—excellent projects and a strong technical foundation. I have an idea that I believe could lead to meaningful growth if we collaborate, and I would love to explore potential opportunities to work together. I genuinely think you could be an excellent long-term collaborator. If this sounds interesting, let me know and I'll share my contact details. Best regards,",
    html: "<p>Hi there,</p><p>I came across your GitHub profile and was very impressed by your work—excellent projects and a strong technical foundation. I have an idea that I believe could lead to meaningful growth if we collaborate, and I would love to explore potential opportunities to work together.</p><p>I genuinely think you could be an excellent long-term collaborator. If this sounds interesting, let me know and I'll share my contact details.</p><p>Best regards,</p>"
  },
  {
    text: "Hello, I recently discovered your GitHub profile and found your projects quite impressive—you have solid technical skills and great work. I'm working on something that could benefit from collaboration, and I think we might be able to achieve significant results together. I believe you'd make a great partner for this venture. If you're interested, feel free to reach out and I can provide more information. Best,",
    html: "<p>Hello,</p><p>I recently discovered your GitHub profile and found your projects quite impressive—you have solid technical skills and great work. I'm working on something that could benefit from collaboration, and I think we might be able to achieve significant results together.</p><p>I believe you'd make a great partner for this venture. If you're interested, feel free to reach out and I can provide more information.</p><p>Best,</p>"
  },
  {
    text: "Hi, I've been looking through GitHub profiles and yours caught my attention. Your technical work and project quality are really strong. I have a concept that I think could be mutually beneficial if we team up, and I'd be excited to discuss potential collaboration opportunities. You seem like someone who would be a valuable long-term partner. If this piques your interest, I'd be happy to share more details. Regards,",
    html: "<p>Hi,</p><p>I've been looking through GitHub profiles and yours caught my attention. Your technical work and project quality are really strong. I have a concept that I think could be mutually beneficial if we team up, and I'd be excited to discuss potential collaboration opportunities.</p><p>You seem like someone who would be a valuable long-term partner. If this piques your interest, I'd be happy to share more details.</p><p>Regards,</p>"
  },
  {
    text: "Hello there, I stumbled upon your GitHub and was really impressed with what I saw—your code quality and project portfolio demonstrate strong technical capabilities. I'm exploring a collaboration opportunity that I believe could be rewarding for both of us, and I'd love to connect to see if we might work together. I think you could be an ideal collaborator for this. If you're open to it, let me know and I'll send you my contact information. Best regards,",
    html: "<p>Hello there,</p><p>I stumbled upon your GitHub and was really impressed with what I saw—your code quality and project portfolio demonstrate strong technical capabilities. I'm exploring a collaboration opportunity that I believe could be rewarding for both of us, and I'd love to connect to see if we might work together.</p><p>I think you could be an ideal collaborator for this. If you're open to it, let me know and I'll send you my contact information.</p><p>Best regards,</p>"
  },
  {
    text: "Hi, I found your GitHub profile while browsing and was struck by the quality of your work—impressive technical skills and well-executed projects. I have an idea that might benefit from a collaborative approach, and I'm interested in exploring whether we could work together on this. I see potential for a productive partnership. If this sounds appealing, please let me know and I can share additional details. Warm regards,",
    html: "<p>Hi,</p><p>I found your GitHub profile while browsing and was struck by the quality of your work—impressive technical skills and well-executed projects. I have an idea that might benefit from a collaborative approach, and I'm interested in exploring whether we could work together on this.</p><p>I see potential for a productive partnership. If this sounds appealing, please let me know and I can share additional details.</p><p>Warm regards,</p>"
  }
];

// Function to get a random email content variation
function getRandomEmailContent() {
  const randomIndex = Math.floor(Math.random() * emailContentVariations.length);
  return emailContentVariations[randomIndex];
}

// Function to sleep/delay
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main function to send emails concurrently in batches with 4-hour delays
async function sendEmailsInBatches() {
  try {
    const senders = readSenders();
    const receivers = readReceivers();

    console.log(`Loaded ${senders.length} senders`);
    console.log(`Loaded ${receivers.length} receivers`);

    const senderCount = senders.length;
    const batchSize = senderCount; // Each batch has 6 emails (one per sender)

    // Display distribution
    console.log("\n=== Email Distribution ===");
    senders.forEach((sender, index) => {
      const senderNumber = index + 1;
      const assignedReceivers = [];
      for (let i = 0; i < receivers.length; i++) {
        // Receiver index i (0-based) goes to sender (i % senderCount)
        if (i % senderCount === index) {
          assignedReceivers.push(i + 1); // 1-based receiver number
        }
      }
      console.log(
        `Sender ${senderNumber} (${sender}): receivers ${assignedReceivers.join(", ")}`
      );
    });
    console.log("");

    // Calculate number of batches
    const totalBatches = Math.ceil(receivers.length / batchSize);

    // Process each batch
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, receivers.length);
      const batchNumber = batchIndex + 1;

      console.log(
        `\n📧 Batch ${batchNumber}/${totalBatches}: Sending emails ${batchStart + 1}-${batchEnd} concurrently...`
      );

      // Create array of promises for concurrent sending
      const sendPromises = [];

      for (let i = batchStart; i < batchEnd; i++) {
        const receiver = receivers[i];
        const receiverNumber = i + 1; // 1-based receiver number
        const senderIndex = i % senderCount; // Which sender (0-based)
        const sender = senders[senderIndex];
        const senderEnvIndex = senderIndex + 1; // 1-based for env vars

        // Check if credentials exist
        const oauth2Client = createOAuth2Client(senderEnvIndex);
        if (!oauth2Client) {
          console.log(
            `⚠️  Skipping receiver ${receiverNumber} (${receiver}) - missing OAuth credentials for sender ${senderEnvIndex} (${sender})`
          );
          continue;
        }

        // Get random email content variation
        const emailContent = getRandomEmailContent();

        // Add send promise to array
        sendPromises.push(
          sendEmail(
            sender,
            senderEnvIndex,
            receiver,
            "are you interested in collaboration with me?",
            emailContent.text,
            emailContent.html
          ).catch((error) => {
            console.error(
              `Failed to send email to receiver ${receiverNumber} (${receiver}):`,
              error.message
            );
            return null; // Return null on error so Promise.all doesn't fail
          })
        );
      }

      // Wait for all emails in this batch to complete (concurrent sending)
      const results = await Promise.all(sendPromises);
      const successCount = results.filter((r) => r !== null).length;
      const failCount = results.length - successCount;

      console.log(
        `✅ Batch ${batchNumber} completed: ${successCount} sent successfully${failCount > 0 ? `, ${failCount} failed` : ""}`
      );

      // Wait 4 hours (±30 mins) before next batch, except for the last batch
      if (batchIndex < totalBatches - 1) {
        const baseHours = 4;
        const baseMs = baseHours * 60 * 60 * 1000;
        const randomOffsetMs = (Math.random() * 60 - 30) * 60 * 1000; // -30 to +30 minutes in milliseconds
        const delayMs = baseMs + randomOffsetMs;
        const delayHours = (delayMs / (60 * 60 * 1000)).toFixed(2);
        const nextBatchTime = new Date(Date.now() + delayMs);
        console.log(
          `\n⏳ Waiting ${delayHours} hours (randomized 4h ±30min) before next batch... (Next batch at ${nextBatchTime.toLocaleString()})`
        );
        await sleep(delayMs);
      }
    }

    console.log("\n✅ All batches completed successfully!");
  } catch (error) {
    console.error("Failed to send emails:", error);
    process.exit(1);
  }
}

// Run the email sending process
if (require.main === module) {
  sendEmailsInBatches();
}

module.exports = {
  createTransporter,
  sendEmail,
  sendEmailsInBatches,
};
