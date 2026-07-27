import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function GET() {
  try {
    const { data, error } = await resend.emails.receiving.list();

    if (error) {
      console.error(error);
      return Response.json(error, { status: 500 });
    }

    return Response.json(data);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
