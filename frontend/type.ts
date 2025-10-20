export interface ParamsProps {
    params: {
        id: string
    }
}

export interface SlugParamsProps {
    params: {
        slug: string
    }
}

// ------------------- CLOUDINARY UPLOAD -------------------

export interface UploadSignatureResponse {
    success: boolean;
    cloudName: string;
    apiKey: string;
    timestamp: number;
    folder: string;
    signature: string;
}

// ------------------- BASE INTERFACES -------------------

export interface IImageAsset {
    public_id?: string;
    url: string;
}

export interface IBaseCategory {
    _id: string;
    title: string;
}

export interface ICourseCreator {
    _id: string;
    name: string;
    email: string;
    avatar: IImageAsset;
}

export interface IBaseLink {
    title: string;
    url: string;
}

export interface IBaseBenefit {
    title: string;
}

export interface IBasePrerequisite {
    title: string;
}

export interface IVideoUpload {
    public_id: string;
    url: string;
}

export interface IBaseLecture {
    videoTitle: string;
    videoDescription: string;
    video: IVideoUpload;
    videoLength: number;
}

export interface IBaseSection {
    sectionTitle: string;
}

export interface IBaseCourseInfo {
    name: string;
    overview: string;
    description: string;
    categories: IBaseCategory[];
    price: number;
    estimatedPrice?: number | null;
    thumbnail: IImageAsset;
    tags: string;
    level: string;
    demoUrl: string;
    ratings: number;
    purchased: number;
    creatorId: ICourseCreator;
    createdAt: string;
    updatedAt: string;
}

// ------------------- CREATE COURSE  -------------------

export interface ICreateCourseInformation {
    name: string;
    overview: string;
    description: string;
    price: number | null;
    estimatedPrice?: number | null;
    categories: string[]; // array of category ids
    tags: string;
    level: string;
    videoDemo: IVideoUpload;
    thumbnail: string; // string initially for file upload
}

export interface ICreateBenefits extends IBaseBenefit {
    id: string; // for handling list rendering
}

export interface ICreatePrerequisites extends IBasePrerequisite {
    id: string; // for handling list rendering
}

export interface ICreateCourseOptions {
    benefits: ICreateBenefits[];
    prerequisites: ICreatePrerequisites[];
}

export interface ICreateCourseContent {
    courseData: ICreateSection[];
}

export interface ICreateSection extends IBaseSection {
    id: string; // for drag-and-drop handling
    sectionContents: ICreateLecture[];
}

export interface ICreateLecture extends IBaseLecture {
    id: string; // for drag-and-drop handling
    videoLinks?: IBaseLink[];
    isUploading?: boolean;
    uploadProgress?: number;
    autoDetectedDuration?: number;
    isManuallyEdited?: boolean;
}

export type ICreateCourse = ICreateCourseInformation & ICreateCourseOptions & ICreateCourseContent;

// ------------------- COURSE SEARCH -------------------

export interface ICourseSearchResponse {
    _id: string;
    name: string;
    description: string;
    categories: [
        {
            _id: string;
            title: string;
        }
    ],
    price: number;
    estimatedPrice: number;
    thumbnail: {
        public_id: string;
        url: string;
    },
    videoDemo: {
        public_id: string;
        url: string;
    },
    tags: string;
    level: string;
    ratings: number;
    purchased: number;
    creatorId: ICourseCreator
}

// ------------------- EDIT COURSE -------------------

export interface IThumbnailResponse {
    public_id?: string;
    url: string;
}

export interface IVideoResponse {
    public_id?: string;
    url: string;
}

export interface IVideoLinkResponse extends IBaseLink {
    _id: string;
}

export interface IBenefitsResponse extends IBaseBenefit {
    _id: string;
}

export interface IPrerequisitesResponse extends IBasePrerequisite {
    _id: string;
}

export interface ICourseSectionResponse {
    _id: string;
    sectionTitle: string;
    sectionContents: ICourseLectureResponse[];
}

export interface ICourseLectureResponse {
    _id: string;
    videoTitle: string;
    videoDescription: string;
    video: IVideoResponse;
    videoLength: number;
    videoLinks: IVideoLinkResponse[];
}

export interface ICourseResponseFromServer {
    _id: string;
    name: string;
    description: string;
    categories: IBaseCategory[];
    price: number;
    estimatedPrice?: number | null;
    thumbnail: IThumbnailResponse;
    tags: string;
    level: string;
    videoDemo: IVideoResponse;
    benefits: IBenefitsResponse[];
    prerequisites: IPrerequisitesResponse[];
    ratings: number;
    purchased: number;
    creatorId: ICourseCreator;
    courseData: ICourseSectionResponse[];
    createdAt: string;
    updatedAt: string;
}

// ------------------- ENROLL COURSE -------------------

export interface IUser {
    _id: string;
    name: string;
    avatar: IImageAsset;
}

export interface ILectureQuestion {
    _id: string;
    question: string;
    replies: any[];
    userId: IUser;
}

export interface SectionLecture {
    _id: string;
    videoTitle: string;
    videoDescription: string;
    videoLength: number;
    video: IVideoResponse;
    videoLinks: IVideoLinkResponse[];
    lectureQuestions: any[]
}

export interface CourseSection {
    _id: string;
    sectionTitle: string;
    sectionContents: SectionLecture[];
}

export interface CourseEnrollResponse {
    _id: string;
    name: string;
    description: string;
    categories: IBaseCategory[];
    price: number;
    estimatedPrice?: number | null;
    thumbnail: IThumbnailResponse;
    tags: string;
    level: string;
    videoDemo: IVideoResponse;
    benefits: IBenefitsResponse[];
    prerequisites: IPrerequisitesResponse[];
    courseData: CourseSection[];
    ratings: number;
    purchased: number;
    creatorId: ICourseCreator;
    reviews: any[];
    createdAt: string;
    updatedAt: string;
}

// ------------------- CART -------------------

export interface CartItem {
    _id: string;
    name: string;
    price: number;
    estimatedPrice?: number;
    thumbnail?: {
        url: string;
    };
    level?: string;
    totalSections?: number;
    totalLectures?: number;
    totalTime?: number;
    instructorName?: string;
    ratings?: number;
}


