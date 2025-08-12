export interface ParamsProps {
    params: {
        id: string
    }
}

export type Thumbnail = string | { public_id: string; url: string };

export interface CourseInfoProps {
    name: string;
    description: string;
    categories: string;
    price: number;
    estimatedPrice: number;
    tags: string;
    level: string;
    demoUrl: string;
    thumbnail: Thumbnail;
}

export interface BenefitsProps {
    title: string;
}

export interface PrerequisitesProps {
    title: string;
}

export interface VideoLinkProps {
    title: string;
    url: string;
}

export interface CourseLectureProps {
    videoTitle: string;
    videoDescription: string;
    videoUrl: string;
    videoLength: number;
    videoLinks: VideoLinkProps[];
}

export interface CourseDataProps {
    sectionTitle: string;
    sectionContents: CourseLectureProps[]
}

export interface Course extends CourseInfoProps {
    _id: string;
    benefits: BenefitsProps[],
    prerequisites: PrerequisitesProps[],
    courseData: CourseDataProps[],
    ratings: number;
    purchased: number;
    reviews: any[]
}

