// Stand-in for the email provider. The real one is an HTTP API that takes a moment to answer.
export async function sendEmail(to: string, subject: string, body: string) {
  await new Promise((r) => setTimeout(r, 200));
  console.log('email to', to, '|', subject, '|', body);
}
