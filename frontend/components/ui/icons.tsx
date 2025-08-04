"use client";

import React from "react";
import {
    Home,
    Database,
    Users,
    Receipt,
    FileText,
    FilePlus,
    Video,
    Palette,
    Layout,
    HelpCircle,
    Tag,
    Sliders,
    BarChart,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    Menu,
    type LucideProps,
    type Icon as LucideIcon,
} from "lucide-react";

const icons = {
    home: Home,
    database: Database,
    users: Users,
    receipt: Receipt,
    "file-text": FileText,
    "file-plus": FilePlus,
    video: Video,
    palette: Palette,
    layout: Layout,
    "help-circle": HelpCircle,
    tag: Tag,
    sliders: Sliders,
    "bar-chart": BarChart,
    "trending-up": TrendingUp,
    "chevron-left": ChevronLeft,
    "chevron-right": ChevronRight,
    menu: Menu,
};

export const Icons = {
    type: ({ icon, ...props }: { icon: keyof typeof icons } & LucideProps) => {
        const IconComponent = icons[icon] || Home;
        return <IconComponent {...props} />;
    },
    ...icons,
};
