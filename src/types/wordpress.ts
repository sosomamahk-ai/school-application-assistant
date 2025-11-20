export type WordPressSchoolType = 'profile' | 'university';

export const WORDPRESS_SCHOOL_CATEGORIES = [
  '香港幼稚园',
  '香港本地小学',
  '香港本地中学',
  '香港国际学校',
  '大学'
] as const;

export type WordPressSchoolCategory = (typeof WORDPRESS_SCHOOL_CATEGORIES)[number];

export interface WordPressSchool {
  id: number;
  title: string;
  type: WordPressSchoolType;
  category: WordPressSchoolCategory | string;
  logo: string | null;
  url: string;
  acf: Record<string, any>;
}

export interface WordPressSchoolResponse {
  profiles: WordPressSchool[];
  universities: WordPressSchool[];
  all: WordPressSchool[];
}


