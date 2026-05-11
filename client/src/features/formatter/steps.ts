export interface Step {
  n: number;
  label: string;
  breadcrumbName: string;
  breadcrumbDesc: string;
  sub: string;
}

export const STEPS: Step[] = [
  {
    n: 1,
    label:         'Bring in',
    breadcrumbName: 'BRING IN',
    breadcrumbDesc: 'FROM THE BOOKENDING EDITOR, OR A .DOCX YOU\'VE BEEN WORKING IN ELSEWHERE',
    sub:           'EDITOR OR UPLOAD',
  },
  {
    n: 2,
    label:         'Mark up',
    breadcrumbName: 'MARK UP',
    breadcrumbDesc: 'CONFIRM CHAPTER & PART STRUCTURE',
    sub:           'CHAPTER STRUCTURE',
  },
  {
    n: 3,
    label:         'Front matter',
    breadcrumbName: 'FRONT MATTER',
    breadcrumbDesc: 'TITLE PAGE, COPYRIGHT, DEDICATION',
    sub:           'TITLE, COPYRIGHT, DEDICATION',
  },
  {
    n: 4,
    label:         'Set the type',
    breadcrumbName: 'SET THE TYPE',
    breadcrumbDesc: 'CHOOSE A THEME & ORNAMENT',
    sub:           'THEME & ORNAMENT',
  },
  {
    n: 5,
    label:         'Proof',
    breadcrumbName: 'PROOF',
    breadcrumbDesc: 'SINGLE PREVIEW',
    sub:           'SINGLE PREVIEW',
  },
  {
    n: 6,
    label:         'Back matter',
    breadcrumbName: 'BACK MATTER',
    breadcrumbDesc: 'BIO, ALSO-BY, ABOUT THE AUTHOR',
    sub:           'BIO, ALSO-BY, ABOUT, ETC.',
  },
  {
    n: 7,
    label:         'Cover · Press',
    breadcrumbName: 'COVER & PRESS',
    breadcrumbDesc: 'EPUB & NEXT ON KDP',
    sub:           'EPUB & NEXT ON KDP',
  },
];
