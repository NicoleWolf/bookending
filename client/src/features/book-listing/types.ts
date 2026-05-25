export interface Review {
  id:          string;
  readerName:  string;
  stars:       number; // 1–5
  body:        string;
  submittedAt: string; // ISO date
  featured:    boolean;
}

export interface BookQA {
  id:       string;
  question: string;
  answer:   string;
  askedAt:  string;
}

export interface BookListing {
  id:         string;
  title:      string;
  authorName: string;
  authorId:   string;
  genre:      string;
  coverUrl:   string | null;
  price:      number;
  edition:    string;
  blurb:      string;
  authorNote: string;
  reviews:    Review[];
  qa:         BookQA[];
}
