import { NextRequest, NextResponse } from "next/server";
import { getSessionCandidateId, clearSessionCookie } from "@/lib/auth";
import {
  getCandidateById,
  updateCandidate,
  deleteCandidate,
  getSavedJobCount,
} from "@/lib/db";

export async function GET() {
  try {
    const candidateId = await getSessionCandidateId();
    if (!candidateId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const candidate = await getCandidateById(candidateId);
    if (!candidate) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const savedCount = await getSavedJobCount(candidateId);

    return NextResponse.json({
      id: candidate.id,
      email: candidate.email,
      name: candidate.name,
      role_types: candidate.role_types,
      remote_pref: candidate.remote_pref,
      alert_freq: candidate.alert_freq,
      created_at: candidate.created_at,
      linkedin_url: candidate.linkedin_url,
      linkedin_verified: candidate.linkedin_verified,
      avatar_url: candidate.avatar_url,
      current_role: candidate.current_role,
      current_company: candidate.current_company,
      years_experience: candidate.years_experience,
      skills: candidate.skills,
      open_to_work: candidate.open_to_work,
      location: candidate.location,
      work_auth: candidate.work_auth,
      notice_period: candidate.notice_period,
      salary_min: candidate.salary_min,
      salary_currency: candidate.salary_currency,
      cv_filename: candidate.cv_filename,
      cv_path: candidate.cv_path,
      savedCount,
    });
  } catch (error) {
    console.error("Get account error:", error);
    return NextResponse.json(
      { error: "Failed to get account" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const candidateId = await getSessionCandidateId();
    if (!candidateId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      role_types,
      remote_pref,
      alert_freq,
      current_role,
      current_company,
      years_experience,
      skills,
      open_to_work,
      location,
      work_auth,
      notice_period,
      salary_min,
      salary_currency,
      linkedin_url,
    } = body;

    const fields: Parameters<typeof updateCandidate>[1] = {};

    if (name !== undefined) fields.name = name;
    if (role_types !== undefined) fields.role_types = JSON.stringify(role_types);
    if (remote_pref !== undefined) fields.remote_pref = remote_pref;
    if (alert_freq !== undefined) fields.alert_freq = alert_freq;
    if (current_role !== undefined) fields.current_role = current_role;
    if (current_company !== undefined) fields.current_company = current_company;
    if (years_experience !== undefined) fields.years_experience = years_experience;
    if (skills !== undefined) fields.skills = typeof skills === "string" ? skills : JSON.stringify(skills);
    if (open_to_work !== undefined) fields.open_to_work = open_to_work;
    if (location !== undefined) fields.location = location;
    if (work_auth !== undefined) fields.work_auth = typeof work_auth === "string" ? work_auth : JSON.stringify(work_auth);
    if (notice_period !== undefined) fields.notice_period = notice_period;
    if (salary_min !== undefined) fields.salary_min = salary_min;
    if (salary_currency !== undefined) fields.salary_currency = salary_currency;
    if (linkedin_url !== undefined) fields.linkedin_url = linkedin_url;

    await updateCandidate(candidateId, fields);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update account error:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const candidateId = await getSessionCandidateId();
    if (!candidateId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteCandidate(candidateId);
    clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
