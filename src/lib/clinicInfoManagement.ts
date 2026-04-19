export interface DoctorTeamMember {
  name?: string | null;
  specialization?: string | null;
  consultation_price?: number | null;
}

export interface ClinicInfoRow {
  id?: string;
  address_line: string | null;
  address_number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  opening_hours: string | null;
  policy_scheduling: string | null;
  policy_rescheduling: string | null;
  policy_cancellation: string | null;
  doctor_ids?: string[] | null;
  doctor_team?: DoctorTeamMember[] | null;
}

export interface DoctorProfile {
  id: string;
  name: string | null;
  email: string | null;
  specialization: string | null;
  consultation_price: number | null;
}

export interface DoctorScheduleRow {
  doctor_id: string;
}

export const EMPTY_CLINIC_INFO: ClinicInfoRow = {
  address_line: '',
  address_number: '',
  neighborhood: '',
  city: '',
  state: '',
  zip_code: '',
  opening_hours: '',
  policy_scheduling: '',
  policy_rescheduling: '',
  policy_cancellation: '',
};

export function getClinicInfoErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function mapDoctorProfiles(rows: DoctorProfile[]): DoctorProfile[] {
  return rows.map((doctor) => ({
    id: doctor.id,
    name: doctor.name,
    email: doctor.email,
    specialization: doctor.specialization,
    consultation_price: doctor.consultation_price || 0,
  }));
}

export function deriveSelectedDoctorIds(
  clinicInfo: ClinicInfoRow | null,
  doctors: DoctorProfile[],
  selectedDoctorIds: string[]
) {
  if (!clinicInfo) return [];
  if (selectedDoctorIds.length > 0) return [];
  if (!Array.isArray(clinicInfo.doctor_team) || clinicInfo.doctor_team.length === 0) return [];
  if (doctors.length === 0) return [];

  return doctors
    .filter((doctor) =>
      clinicInfo.doctor_team?.some(
        (teamMember) =>
          (teamMember.name || '') === (doctor.name || '') &&
          (teamMember.specialization || null) === (doctor.specialization || null)
      )
    )
    .map((doctor) => doctor.id);
}

export function buildDoctorPrices(
  doctors: DoctorProfile[],
  clinicInfo: ClinicInfoRow | null
) {
  const prices: Record<string, number> = {};

  doctors.forEach((doctor) => {
    prices[doctor.id] = doctor.consultation_price || 0;
  });

  if (Array.isArray(clinicInfo?.doctor_team) && clinicInfo.doctor_team.length > 0) {
    clinicInfo.doctor_team.forEach((teamMember) => {
      const doctor = doctors.find(
        (item) =>
          item.name === teamMember.name &&
          item.specialization === teamMember.specialization
      );

      if (
        doctor &&
        teamMember.consultation_price !== undefined &&
        teamMember.consultation_price !== null
      ) {
        prices[doctor.id] = teamMember.consultation_price;
      }
    });
  }

  return prices;
}

export function normalizePriceInput(value: string) {
  let cleanValue = value.replace(/[^\d,.]/g, '');

  if (cleanValue.includes(',')) {
    const parts = cleanValue.split(',');
    cleanValue = `${parts[0]},${(parts[1] || '').slice(0, 2)}`;
  }

  if (cleanValue.includes('.')) {
    const parts = cleanValue.split('.');
    cleanValue = `${parts[0]}.${(parts[1] || '').slice(0, 2)}`;
  }

  return parseFloat(cleanValue.replace(',', '.')) || 0;
}

export function formatConsultationPrice(price: number) {
  return price.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function buildDoctorTeam(
  doctors: DoctorProfile[],
  selectedDoctorIds: string[],
  doctorPrices: Record<string, number>
): DoctorTeamMember[] {
  return doctors
    .filter((doctor) => selectedDoctorIds.includes(doctor.id))
    .map((doctor) => ({
      name: doctor.name || null,
      specialization: doctor.specialization || null,
      consultation_price: doctorPrices[doctor.id] || doctor.consultation_price || 0,
    }));
}
