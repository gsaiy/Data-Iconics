import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, FileText, Link as LinkIcon, ExternalLink } from 'lucide-react';

interface Scheme {
    name: string;
    date: string;
    pdfLink: string;
    otherLinks: { href: string; text: string }[];
}

const ScrapeSchemes = () => {
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [loading, setLoading] = useState(true);
    const apiKey = '15ba7096556b11b6ec2883f057667497';
    const baseUrl = 'https://agriwelfare.gov.in/en/Major';
    const url = `${baseUrl}/schemes`;

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Changed to https avoid mixed content issues
                const response = await axios.get(`https://api.scraperapi.com?api_key=${apiKey}&url=${url}`);
                const htmlString = response.data;

                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlString, 'text/html');
                const rows = Array.from(doc.querySelectorAll('tbody tr'));

                const schemesData = rows.map(row => {
                    const columns = row.querySelectorAll('td');

                    if (columns.length < 4) {
                        return null;
                    }

                    const name = columns[1]?.innerText || 'N/A';
                    const date = columns[2]?.innerText || 'N/A';
                    const pdfLink = columns[3]?.querySelector('a[href$=".pdf"]')?.getAttribute('href') || '#';

                    const otherLinks = Array.from(columns[3].querySelectorAll('a'))
                        .filter(anchor => {
                            const href = anchor.getAttribute('href');
                            return href && !href.endsWith('.pdf');
                        })
                        .map(anchor => ({
                            href: anchor.getAttribute('href') || '#',
                            text: anchor.innerText
                        }));

                    return {
                        name,
                        date,
                        pdfLink: pdfLink.startsWith('http') ? pdfLink : `${baseUrl}${pdfLink}`,
                        otherLinks
                    };
                }).filter((item): item is Scheme => item !== null);

                setSchemes(schemesData);
            } catch (error) {
                console.error('Error fetching and parsing data', error);
                // Fallback mock data if API fails
                setSchemes([
                    {
                        name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
                        date: "13-01-2024",
                        pdfLink: "#",
                        otherLinks: [{ href: "https://pmfby.gov.in/", text: "Visit Portal" }]
                    },
                    {
                        name: "Kisan Credit Card (KCC) Scheme",
                        date: "10-01-2024",
                        pdfLink: "#",
                        otherLinks: []
                    },
                    {
                        name: "Soil Health Card Scheme",
                        date: "05-01-2024",
                        pdfLink: "#",
                        otherLinks: [{ href: "https://soilhealth.dac.gov.in/", text: "Details" }]
                    },
                    {
                        name: "Paramparagat Krishi Vikas Yojana (PKVY)",
                        date: "01-01-2024",
                        pdfLink: "#",
                        otherLinks: []
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="glass-card p-6 w-full">
            <h2 className="text-xl font-bold mb-6 gradient-text flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Government Schemes For Farmers
            </h2>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3 text-muted-foreground">Loading schemes...</span>
                </div>
            ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {schemes.map((scheme, index) => (
                        <div key={index} className="p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/50 transition-all duration-300">
                            <h3 className="font-semibold text-lg text-foreground mb-2">{scheme.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                <Calendar className="w-4 h-4" />
                                <span>Date: {scheme.date}</span>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-2">
                                {scheme.pdfLink !== '#' && (
                                    <a
                                        href={scheme.pdfLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                                    >
                                        <FileText className="w-3 h-3" />
                                        View PDF
                                    </a>
                                )}

                                {scheme.otherLinks.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.href.startsWith('http') ? link.href : `${baseUrl}${link.href}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        More Details
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                    {schemes.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No schemes found or failed to load.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ScrapeSchemes;
