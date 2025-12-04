import React from 'react';
import Layout from '@/components/Layout';
import MakeupForm from '@/components/virtualTryOn/MakeupForm';

const VirtualTryOnPage = () => {
    return (
        <Layout>
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12">
                <div className="container mx-auto px-4">
                    <MakeupForm />
                </div>
            </div>
        </Layout>
    );
};

export default VirtualTryOnPage;