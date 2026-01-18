import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Newspaper, ExternalLink, Calendar } from 'lucide-react';

interface NewsItem {
    title: string;
    link: string;
    date: string;
    imageSrc: string;
    imageAlt: string;
}

interface ScrapeNewsProps {
    topi?: string;
    maxw?: string;
}

const ScrapeNews: React.FC<ScrapeNewsProps> = ({ topi, maxw }) => {
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [visibleItems, setVisibleItems] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const newsRef = useRef<(HTMLDivElement | null)[]>([]);
    const apiKey = "15ba7096556b11b6ec2883f057667497";
    const baseUrl = "https://krishijagran.com";
    const url = `${baseUrl}/feeds`;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(
                    `https://api.scraperapi.com?api_key=${apiKey}&url=${url}`
                );
                const htmlString = response.data;
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlString, "text/html");
                const items = Array.from(doc.querySelectorAll(".n-f-item"));

                const newsData = items.map((item) => {
                    const titleLink = item.querySelector("h2 a");
                    const relativeLink = titleLink?.getAttribute("href") || "#";
                    const fullLink = relativeLink.startsWith('http') ? relativeLink : `${baseUrl}${relativeLink}`;

                    const imgElement = item.querySelector("img");
                    let imageSrc = "path/to/fallback-image.jpg";

                    if (imgElement) {
                        const dataSrc = imgElement.getAttribute("data-src");
                        imageSrc = dataSrc ? dataSrc : imgElement.src;

                        if (imageSrc && !imageSrc.startsWith("http")) {
                            imageSrc = `${baseUrl}${imageSrc}`;
                        }
                    }

                    return {
                        title: titleLink?.textContent || "No Title",
                        link: fullLink,
                        date: item.querySelector("small")?.textContent || "No Date",
                        imageSrc: imageSrc,
                        imageAlt: imgElement ? imgElement.alt : "Image not available",
                    };
                });

                setNewsItems(newsData);
            } catch (error) {
                console.error("Error fetching and parsing data", error);
                // Fallback mock data if API fails
                setNewsItems([
                    {
                        title: "Record Wheat Production Expected This Season Despite Climate Challenges",
                        link: "https://krishijagran.com/",
                        date: "Jan 18, 2026",
                        imageSrc: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=1000&auto=format&fit=crop",
                        imageAlt: "Wheat Field"
                    },
                    {
                        title: "New Government Subsidy for Solar Pumps Announced",
                        link: "https://krishijagran.com/",
                        date: "Jan 17, 2026",
                        imageSrc: "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=1000&auto=format&fit=crop",
                        imageAlt: "Solar Panels"
                    },
                    {
                        title: "Organic Farming on the Rise in Northern States",
                        link: "https://krishijagran.com/",
                        date: "Jan 16, 2026",
                        imageSrc: "https://images.unsplash.com/photo-1625246333195-bf8f3f01b0b7?q=80&w=1000&auto=format&fit=crop",
                        imageAlt: "Organic Farming"
                    },
                    {
                        title: "Global Agri-Tech Summit 2026: Key Highlights",
                        link: "https://krishijagran.com/",
                        date: "Jan 15, 2026",
                        imageSrc: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=1000&auto=format&fit=crop",
                        imageAlt: "Agri Tech"
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const target = entry.target as HTMLDivElement;
                    // Find index in refs
                    const index = newsRef.current.findIndex(ref => ref === target);
                    if (index !== -1) {
                        setVisibleItems((prev) =>
                            prev.includes(index) ? prev : [...prev, index]
                        );
                    }
                }
            });
        });

        newsRef.current.forEach((item) => {
            if (item) observer.observe(item);
        });

        return () => {
            newsRef.current.forEach((item) => {
                if (item) observer.unobserve(item);
            });
        };
    }, [newsItems]);

    return (
        <div
            className="glass-card p-6 w-full"
            style={{
                marginTop: topi ? topi : undefined,
                width: maxw ? maxw : undefined
            }}
        >
            <h2 className="text-xl font-bold mb-6 gradient-text flex items-center gap-2">
                <Newspaper className="w-5 h-5" />
                Recent Agricultural News
            </h2>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3 text-muted-foreground">Loading news...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {newsItems.map((item, index) => (
                        <div
                            key={index}
                            ref={(el) => {
                                newsRef.current[index] = el;
                            }}
                            className={`
                group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 
                hover:bg-card/80 transition-all duration-500 ease-out 
                ${visibleItems.includes(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
              `}
                        >
                            <div className="flex gap-4 p-4">
                                <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-muted">
                                    <img
                                        src={item.imageSrc}
                                        alt={item.imageAlt}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image';
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col justify-between flex-1 min-w-0">
                                    <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-2"
                                        title={item.title}
                                    >
                                        {item.title}
                                    </a>

                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {item.date}
                                        </span>
                                        <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Read <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ScrapeNews;
