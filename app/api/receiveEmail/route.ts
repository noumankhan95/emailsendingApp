import { NextRequest, NextResponse } from "next/server";
import {
  addDoc,
  and,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/firebase";
import { revalidatePath } from "next/cache";
export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const eid = data.get("emailId");
    const uEmail = data.get("uEmail");
    const stillInterested = data.get("stillInterested");
    const responses: any = {};
    const totalquestions = data.get("totalquestions");
    const numQuestions = totalquestions
      ? parseInt(totalquestions as string, 10)
      : 0;
    console.log("Total Questions", totalquestions);
    console.log("sitll interested", stillInterested);
    for (let i = 1; i <= numQuestions; i++) {
      const questionResponse = data.get(`question${i}`);
      console.log("q response " + i, questionResponse);

      responses[`q${i}`] = questionResponse || "no Response";
    }
    responses["stillInterested"] = stillInterested || "no Response";
    const q = query(collection(db, "emails"), and(where("emailId", "==", eid)));
    const email = await getDocs(q);
    let updatedResponses = [];
    if (email.size > 0) {
      const emailData = email.docs[0]?.data();
      console.log(emailData, "emailData");
      if (!emailData?.responses || emailData?.responses?.length == 0) {
        updatedResponses.push({ response: responses, userEmail: uEmail });
      } else {
        updatedResponses = emailData?.responses?.map(
          (r: { response: any; userEmail: string }) => {
            if (r.userEmail === uEmail) {
              return { ...r, response: responses };
            }
            return r;
          },
        );
      }
      console.log("Updated Responses", updatedResponses);
      await updateDoc(doc(db, "emails", email.docs[0].id), {
        responses: updatedResponses,
        updatedAt: serverTimestamp(),
      });
    } else {
      throw new Error("No Email Exists");
    }
    revalidatePath("/");
    return NextResponse.json(
      {
        status: 1,
        data: { message: "Success" },
      },
      { status: 200 },
    );
  } catch (e) {
    console.log(e, "Error inreceive Email");
    return NextResponse.json(
      { status: 0, data: { message: e } },
      { status: 403 },
    );
  }
}
