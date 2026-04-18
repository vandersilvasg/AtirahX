export interface InstanceStatus {
  connected?: boolean;
  jid?: string;
  loggedIn?: boolean;
}

export interface Instance {
  id?: string;
  status?: string | InstanceStatus;
  name?: string;
  profileName?: string;
  profilePicUrl?: string;
  owner?: string;
  created?: string;
  currentTime?: string;
  [key: string]: unknown;
}

export type InstancesListResponse = {
  instances?: Instance[];
  data?: Instance[] | Instance;
} & Instance;

export type ConnectInstanceResponse = {
  instance?: {
    paircode?: string;
  };
};

export type EditNameModalState = {
  open: boolean;
  instanceId: string;
  currentName: string;
};

export type ConnectModalState = {
  open: boolean;
  instanceName: string;
  phoneNumber: string;
  paircode: string;
  isWaitingConnection: boolean;
};

export const INITIAL_EDIT_MODAL: EditNameModalState = {
  open: false,
  instanceId: '',
  currentName: '',
};

export const INITIAL_CONNECT_MODAL: ConnectModalState = {
  open: false,
  instanceName: '',
  phoneNumber: '',
  paircode: '',
  isWaitingConnection: false,
};

export const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export function normalizeInstance(value: unknown): Instance {
  if (!isObjectRecord(value)) return {};

  const nestedInstance = isObjectRecord(value.instance) ? value.instance : {};

  return {
    id: (value.id as string) || (value.instanceId as string) || (nestedInstance.instanceId as string),
    name:
      (value.name as string) ||
      (value.instanceName as string) ||
      (nestedInstance.instanceName as string) ||
      'N/A',
    profileName:
      (value.profileName as string) ||
      (nestedInstance.profileName as string) ||
      (value.systemName as string) ||
      'Sem nome',
    profilePicUrl:
      (value.profilePicUrl as string) ||
      (nestedInstance.profilePicUrl as string) ||
      (value.profilePictureUrl as string),
    status:
      (value.status as string | InstanceStatus) ||
      (nestedInstance.status as string | InstanceStatus) ||
      (value.connectionStatus as string),
    owner: (value.owner as string) || (nestedInstance.owner as string) || (value.number as string),
    created: (value.created as string) || (nestedInstance.created as string) || (value.createdAt as string),
    currentTime: (value.currentTime as string) || (value.updatedAt as string) || (value.lastSeen as string),
    ...value,
  };
}

export function normalizeInstancesResponse(data: unknown): Instance[] {
  if (Array.isArray(data)) {
    return data.map(normalizeInstance);
  }

  if (isObjectRecord(data) && Array.isArray((data as InstancesListResponse).instances)) {
    return ((data as InstancesListResponse).instances ?? []).map(normalizeInstance);
  }

  if (isObjectRecord(data) && (data as InstancesListResponse).data) {
    const rawData = (data as InstancesListResponse).data;
    return (Array.isArray(rawData) ? rawData : [rawData]).map(normalizeInstance);
  }

  return [normalizeInstance(data)];
}

export function getConnectPaircode(data: ConnectInstanceResponse[] | ConnectInstanceResponse) {
  if (Array.isArray(data) && data.length > 0) {
    return data[0]?.instance?.paircode || '';
  }

  return data.instance?.paircode || '';
}

export function getStatusString(status: string | InstanceStatus | undefined): string {
  if (!status) return 'unknown';
  if (typeof status === 'string') return status;
  if (status.connected || status.loggedIn) return 'connected';
  return 'disconnected';
}

export function isConnected(status: string | InstanceStatus | undefined): boolean {
  if (!status) return false;
  if (typeof status === 'string') return status === 'connected';
  return !!(status.connected || status.loggedIn);
}

export function getWhatsAppIntegrationErrorMessage(error: unknown, fallback = 'Erro desconhecido') {
  return error instanceof Error && error.message ? error.message : fallback;
}
