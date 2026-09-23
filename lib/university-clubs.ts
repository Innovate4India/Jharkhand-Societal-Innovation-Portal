export const UNIVERSITY_CLUBS = [
  { name: 'NCC', fullName: 'National Cadet Corps', focus: 'Cadet training and community service' },
  { name: 'NSS', fullName: 'National Service Scheme', focus: 'Community service and volunteering' },
  { name: 'Rovers & Rangers', focus: 'Community service, volunteering and field activities' },
  { name: 'Red Ribbon Club', focus: 'Blood donation and health awareness' },
  { name: 'Eco Club', focus: 'Environment, sustainability and awareness' },
  { name: 'Innovation & Entrepreneurship Club', focus: 'Innovation, projects, hackathons and entrepreneurship' },
] as const

export const UNIVERSITY_CLUB_NAMES = UNIVERSITY_CLUBS.map((club) => club.name)
