export interface Certificate {
  id: string;
  recipientName: string;
  workshopName: string;
  issueDate: string;
  skills: string[];
  instructor: string;
}

export interface Workshop {
  id: string;
  title: string;
  date: string;
  description: string;
  skills: string[];
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  instructor: string;
  image: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatar: string;
}
