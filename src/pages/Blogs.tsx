import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import InfiniteScroll from "react-infinite-scroll-component";

interface Blog {
  id: string;
  title: string;
  image: string;
  author: string;
  publishedAt: string;
  url: string;
  description: string;
  source: string;
}

const Blogs: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>("nutrition"); // Default to "nutrition"
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const API_KEY = "YOUR_NEWS_API_KEY";
  const categories = [
    { id: "nutrition", name: "Pregnancy Nutrition", query: "pregnancy nutrition OR prenatal vitamins" },
    { id: "health", name: "Maternal Health", query: "maternal health OR pregnancy exercise" },
    { id: "mental-health", name: "Mental Health", query: "pregnancy mental health OR postpartum depression" },
    { id: "preparation", name: "Birth Preparation", query: "birth preparation OR labor stages" },
  ];

  const fetchBlogs = async (initialLoad = false) => {
    if (!selectedCategory || isLoading) return;
  
    setIsLoading(true);
    try {
      const category = categories.find(c => c.id === selectedCategory);
      if (!category) return;
  
      // Build query parameters
      const params = new URLSearchParams({
        q: category.query,
        from: "2025-02-28", // Add from date parameter
        sortBy: "publishedAt",
        pageSize: "10",
        page: page.toString(),
        apiKey: API_KEY,
      });
  
      const response = await fetch(
        `https://newsapi.org/v2/everything?${params}`
      );
      
      const data = await response.json();
      if (data.status !== "ok") throw new Error("API Error");

      const newBlogs = data.articles
        .filter((a: any) => a.title && a.urlToImage) // Filter out articles without title or image
        .map((article: any) => ({
          id: article.url,
          title: article.title,
          image: article.urlToImage,
          author: article.author || article.source.name,
          publishedAt: article.publishedAt,
          url: article.url,
          description: article.description,
          source: article.source.name,
        }));

      setBlogs(prev => initialLoad ? newBlogs : [...prev, ...newBlogs]);
      setHasMore(data.totalResults > blogs.length + newBlogs.length);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCategory) {
      setPage(1);
      setBlogs([]);
      fetchBlogs(true);
    }
  }, [selectedCategory]);

  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-100 to-red-50 py-16 px-4 text-center rounded-lg my-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">
          Pregnancy & Maternal Care Resources
        </h1>
        <p className="text-lg max-w-2xl mx-auto text-gray-600">
          Trusted articles and research-based information for expecting mothers, 
          curated from medical sources and maternal health experts.
        </p>
      </div>

      {/* Category Selector */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold text-center mb-6 text-red-600">
          Explore Pregnancy Topics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 rounded-lg transition-all duration-300 ${
                selectedCategory === category.id
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-white text-red-600 hover:bg-red-50 border border-red-100"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Blog List with Infinite Scroll */}
      {selectedCategory && (
        <InfiniteScroll
          dataLength={blogs.length}
          next={() => fetchBlogs()}
          hasMore={hasMore}
          loader={
            <div className="text-center my-8 text-gray-600">
              Loading more articles...
            </div>
          }
          endMessage={
            <div className="text-center my-8 text-gray-600">
              You've reached all available articles in this category
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <a
                href={blog.url}
                key={blog.id}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 block hover:no-underline"
              >
                <div className="h-48 relative">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/fallback-blog.jpg';
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">
                    {blog.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {blog.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="max-w-[60%] truncate">
                      {blog.author}
                    </span>
                    <span>
                      {new Date(blog.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-gray-400">
                    Source: {blog.source}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </InfiniteScroll>
      )}

      {/* Attribution and Initial State */}
      {!selectedCategory ? (
        <div className="text-center py-16 text-gray-500">
          Select a category to view related articles
        </div>
      ) : (
        <div className="text-center text-sm text-gray-400 mt-8 pb-4">
          Articles powered by NewsAPI.org
        </div>
      )}
    </Layout>
  );
};

export default Blogs;