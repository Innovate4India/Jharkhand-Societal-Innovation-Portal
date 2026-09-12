interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Attach JWT token if it exists
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `HTTP Error: ${response.status}`,
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

export async function login(email: string, password: string) {
  return apiCall<{
    token: string;
    user: {
      _id: string;
      name: string;
      email: string;
      role: string;
      institution?: string;
      universityDepartment?: string;
      accountType?: string;
    };
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(userData: Record<string, any>) {
  return apiCall<{
    token: string;
    user: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
  }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function getCurrentUser() {
  return apiCall<{
    user: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
  }>('/api/auth/me', {
    method: 'GET',
  });
}

export async function chatWithSahayak(problem: string, language: 'en' | 'hi' = 'en') {
  return apiCall<{
    message?: string;
    understanding?: { summary?: string };
    severity?: string;
    can_solve_myself?: boolean;
    solution_info?: { steps?: string[]; tools_materials?: string[]; estimated_time?: string; estimated_cost?: string };
    safety_guidance?: { precautions?: string[]; when_to_stop?: string };
    escalation?: { required?: boolean; contact?: string; reason?: string };
    prevention?: string[];
    helplines?: { name?: string; number?: string; purpose?: string }[];
  }>('/api/sahayak/chat', {
    method: 'POST',
    body: JSON.stringify({ problem, language }),
  });
}

export async function getChallenges() {
  return apiCall<Array<{
    _id: string;
    title: string;
    description: string;
    category: string;
    district: string;
    villageOrCity: string;
    status: string;
    priority: string;
    fundingAmount?: number;
    fundingStatus?: 'pending' | 'approved';
    fundingApprovedAt?: string;
    createdAt?: string;
    submittedBy?: { _id?: string; name?: string; email?: string; role?: string };
    assignedUniversity?: { _id?: string; name?: string; email?: string; institution?: string; universityDepartment?: string };
  }>>('/api/challenges', {
    method: 'GET',
  });
}

export async function getUniversities() {
  return apiCall<Array<{
    _id: string;
    name: string;
    email?: string;
    institution?: string;
    universityDepartment?: string;
    facultyMentor?: { _id?: string; name?: string; email?: string; universityDepartment?: string; accountType?: string };
    accountType?: string;
  }>>('/api/users/universities', {
    method: 'GET',
  });
}

export async function getUniversityParticipation() {
  return apiCall<Array<{
    universityId: string;
    universityName: string;
    assigned: number;
    active: number;
    completed: number;
    status: 'Active' | 'Registered';
  }>>('/api/users/university-participation', { method: 'GET' });
}

export async function getUniversityMembers() {
  return apiCall<Array<{
    _id: string;
    name: string;
    email?: string;
    institution?: string;
    universityDepartment?: string;
    facultyMentor?: { _id?: string; name?: string; email?: string; universityDepartment?: string; accountType?: string };
    accountType?: string;
  }>>('/api/users/university-members', { method: 'GET' });
}

export async function getProjects() {
  return apiCall<Array<{
    _id: string;
    title: string;
    description: string;
    challenge?: { _id?: string; title?: string; category?: string; district?: string; status?: string };
    university?: { _id?: string; name?: string; institution?: string; universityDepartment?: string };
    universityDepartment?: string;
    facultyMentor?: { _id?: string; name?: string; accountType?: string; universityDepartment?: string };
    projectType: string;
    status: string;
    solutionSummary?: string;
    expectedImpact?: string;
    estimatedBudget?: number;
    timeline?: { startDate?: string; expectedCompletionDate?: string };
    teamMembers?: { _id?: string; name?: string; universityDepartment?: string; accountType?: string; email?: string }[];
    industryPartners?: { _id?: string; name?: string; organizationName?: string; organizationType?: string; expertise?: string; email?: string }[];
    createdBy?: { name?: string };
    createdAt?: string;
  }>>('/api/projects', {
    method: 'GET',
  });
}

export async function getProjectById(id: string) {
  return apiCall<{
    _id: string;
    title: string;
    description: string;
    challenge?: { _id?: string; title?: string; category?: string; district?: string; status?: string; description?: string };
    university?: { _id?: string; name?: string; institution?: string; universityDepartment?: string };
    universityDepartment?: string;
    projectType: string;
    status: string;
    solutionSummary?: string;
    expectedImpact?: string;
    estimatedBudget?: number;
    timeline?: { startDate?: string; expectedCompletionDate?: string };
    teamMembers?: { _id?: string; name?: string; universityDepartment?: string; accountType?: string; email?: string }[];
    industryPartners?: { _id?: string; name?: string; organizationName?: string; organizationType?: string; expertise?: string; email?: string }[];
    createdBy?: { _id?: string; name?: string; institution?: string; universityDepartment?: string };
    createdAt?: string;
  }>(`/api/projects/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
}

export async function createProject(projectData: {
  title: string;
  description: string;
  challenge: string;
  universityDepartment: string;
  facultyMentor?: string;
  projectType: string;
  solutionSummary: string;
  objectives?: string[];
  expectedImpact: string;
  estimatedBudget?: number;
  timeline: { startDate: string; expectedCompletionDate: string };
}) {
  return apiCall('/api/projects', {
    method: 'POST',
    body: JSON.stringify(projectData),
  });
}

export async function updateProjectStatus(id: string, status: string) {
  return apiCall(`/api/projects/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function updateProjectTeam(id: string, teamMembers: string[]) {
  return apiCall(`/api/projects/${encodeURIComponent(id)}/team`, {
    method: 'PATCH',
    body: JSON.stringify({ teamMembers }),
  });
}

export async function updateProjectFaculty(id: string, facultyMentor: string) {
  return apiCall(`/api/projects/${encodeURIComponent(id)}/faculty`, {
    method: 'PATCH',
    body: JSON.stringify({ facultyMentor }),
  });
}

export async function updateProjectPartners(id: string, industryPartners: string[]) {
  return apiCall(`/api/projects/${encodeURIComponent(id)}/partners`, {
    method: 'PATCH',
    body: JSON.stringify({ industryPartners }),
  });
}

export async function getCollaborations(projectId?: string) {
  const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
  return apiCall<Array<{
    _id: string;
    project?: { _id?: string; title?: string; status?: string };
    industryPartner?: { _id?: string; name?: string; organizationName?: string; organizationType?: string; expertise?: string };
    collaborationType: string;
    proposal: string;
    fundingAmount?: number;
    status: string;
    createdAt?: string;
  }>>(`/api/collaborations${query}`, { method: 'GET' });
}

export async function createCollaboration(collaborationData: {
  project: string;
  collaborationType: string;
  proposal: string;
  fundingAmount?: number;
}) {
  return apiCall('/api/collaborations', {
    method: 'POST',
    body: JSON.stringify(collaborationData),
  });
}

export async function updateCollaborationStatus(id: string, status: string) {
  return apiCall(`/api/collaborations/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function updateChallengeStatus(id: string, status: string) {
  return apiCall(`/api/challenges/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function updateChallengePriority(id: string, priority: string) {
  return apiCall(`/api/challenges/${encodeURIComponent(id)}/priority`, {
    method: 'PATCH',
    body: JSON.stringify({ priority }),
  });
}

export async function assignChallenge(id: string, assignedUniversity: string) {
  return apiCall(`/api/challenges/${encodeURIComponent(id)}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assignedUniversity }),
  });
}

export async function approveChallengeFunding(id: string, fundingAmount: number) {
  return apiCall(`/api/challenges/${encodeURIComponent(id)}/funding`, {
    method: 'PATCH',
    body: JSON.stringify({ fundingAmount }),
  });
}

export async function getChallengeById(id: string) {
  return apiCall<{
    _id: string;
    title: string;
    description: string;
    category: string;
    district: string;
    villageOrCity: string;
    status: string;
    priority: string;
    fundingAmount?: number;
    fundingStatus?: 'pending' | 'approved';
    fundingApprovedAt?: string;
    createdAt?: string;
    submittedBy?: { name?: string; email?: string; role?: string; district?: string; villageOrCity?: string };
    assignedUniversity?: { name?: string; email?: string; institution?: string; universityDepartment?: string };
    location?: { latitude?: number | null; longitude?: number | null };
    media?: { images?: { url?: string }[]; videos?: { url?: string }[]; documents?: { url?: string; fileName?: string }[] };
    aiAnalysis?: { category?: string; priority?: string; summary?: string; analyzedAt?: string };
  }>(`/api/challenges/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
}

export async function createChallenge(challengeData: {
  title: string;
  description: string;
  category: string;
  district: string;
  villageOrCity: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  location?: { latitude: number; longitude: number };
  media?: { images?: { url: string }[]; videos?: { url: string }[]; documents?: { url: string; fileName: string }[] };
}) {
  return apiCall<{
    _id: string;
    title: string;
    status: string;
  }>('/api/challenges', {
    method: 'POST',
    body: JSON.stringify(challengeData),
  });
}

export async function acceptChallenge(id: string) {
  return apiCall(`/api/challenges/${encodeURIComponent(id)}/accept`, {
    method: 'PATCH',
  });
}

export function saveAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

export function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
  }
}

export function saveCurrentUser(user: Record<string, any>) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('current_user', JSON.stringify(user));
  }
}

export function getCurrentUserFromStorage() {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('current_user');
    return user ? JSON.parse(user) : null;
  }
  return null;
}
