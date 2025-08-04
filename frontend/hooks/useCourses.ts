// // hooks/useCourses.ts
// import { useState, useEffect, useMemo } from 'react';
// import { Course } from '@/type';

// export const useCourses = () => {
//     const [courses, setCourses] = useState<Course[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);

//     // Filters
//     const [searchTerm, setSearchTerm] = useState('');
//     const [categoryFilter, setCategoryFilter] = useState('all');
//     const [levelFilter, setLevelFilter] = useState('all');
//     const [priceFilter, setPriceFilter] = useState('all');
//     const [sortBy, setSortBy] = useState('newest');

//     // Pagination
//     const [currentPage, setCurrentPage] = useState(1);
//     const [itemsPerPage, setItemsPerPage] = useState(12);

//     // View mode
//     const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

//     // Fetch courses
//     const fetchCourses = async () => {
//         try {
//             setLoading(true);
//             const response = await fetch('http://localhost:8000/api/course/get_all_courses');

//             if (!response.ok) {
//                 throw new Error('Failed to fetch courses');
//             }

//             const data = await response.json();

//             if (data.success) {
//                 setCourses(data.courses);
//             } else {
//                 throw new Error('API returned error');
//             }
//         } catch (err) {
//             setError(err instanceof Error ? err.message : 'An error occurred');
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchCourses();
//     }, []);

//     // Get unique categories and levels
//     const { categories, levels } = useMemo(() => {
//         const uniqueCategories = [...new Set(courses.map(course => course.categories).filter(Boolean))];
//         const uniqueLevels = [...new Set(courses.map(course => course.level).filter(Boolean))];

//         return {
//             categories: uniqueCategories,
//             levels: uniqueLevels,
//         };
//     }, [courses]);

//     // Filter and sort courses
//     const filteredAndSortedCourses = useMemo(() => {
//         let filtered = courses.filter(course => {
//             // Search filter
//             if (searchTerm) {
//                 const searchLower = searchTerm.toLowerCase();
//                 const matchesSearch =
//                     course.name.toLowerCase().includes(searchLower) ||
//                     course.description.toLowerCase().includes(searchLower) ||
//                     course.tags.toLowerCase().includes(searchLower);

//                 if (!matchesSearch) return false;
//             }

//             // Category filter
//             if (categoryFilter !== 'all' && course.categories !== categoryFilter) {
//                 return false;
//             }

//             // Level filter
//             if (levelFilter !== 'all' && course.level !== levelFilter) {
//                 return false;
//             }

//             // Price filter
//             if (priceFilter !== 'all') {
//                 const price = course.price;
//                 switch (priceFilter) {
//                     case 'free':
//                         if (price !== 0) return false;
//                         break;
//                     case '0-25':
//                         if (price < 0 || price > 25) return false;
//                         break;
//                     case '25-50':
//                         if (price < 25 || price > 50) return false;
//                         break;
//                     case '50-100':
//                         if (price < 50 || price > 100) return false;
//                         break;
//                     case '100+':
//                         if (price < 100) return false;
//                         break;
//                 }
//             }

//             return true;
//         });

//         // Sort courses
//         filtered.sort((a, b) => {
//             switch (sortBy) {
//                 case 'price-low':
//                     return a.price - b.price;
//                 case 'price-high':
//                     return b.price - a.price;
//                 case 'rating':
//                     return b.ratings - a.ratings;
//                 case 'popularity':
//                     return b.purchased - a.purchased;
//                 default:
//                     return 0;
//             }
//         });

//         return filtered;
//     }, [courses, searchTerm, categoryFilter, levelFilter, priceFilter, sortBy]);

//     // Pagination
//     const totalResults = filteredAndSortedCourses.length;
//     const totalPages = Math.ceil(totalResults / itemsPerPage);
//     const startIndex = (currentPage - 1) * itemsPerPage;
//     const endIndex = startIndex + itemsPerPage;
//     const paginatedCourses = filteredAndSortedCourses.slice(startIndex, endIndex);

//     // Reset page when filters change
//     useEffect(() => {
//         setCurrentPage(1);
//     }, [searchTerm, categoryFilter, levelFilter, priceFilter, sortBy, itemsPerPage]);

//     // Clear all filters
//     const clearFilters = () => {
//         setSearchTerm('');
//         setCategoryFilter('all');
//         setLevelFilter('all');
//         setPriceFilter('all');
//         setSortBy('default');
//     };

//     return {
//         // Data
//         courses: paginatedCourses,
//         loading,
//         error,
//         categories,
//         levels,

//         // Filters
//         searchTerm,
//         setSearchTerm,
//         categoryFilter,
//         setCategoryFilter,
//         levelFilter,
//         setLevelFilter,
//         priceFilter,
//         setPriceFilter,
//         sortBy,
//         setSortBy,
//         clearFilters,

//         // Pagination
//         currentPage,
//         setCurrentPage,
//         totalPages,
//         totalResults,
//         itemsPerPage,
//         setItemsPerPage,

//         // View mode
//         viewMode,
//         setViewMode,

//         // Actions
//         refetch: fetchCourses,
//     };
// };