import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

const sampleBlogs = {
  "nutritional-counseling": [
    {
      id: 1,
      title: "Essential Nutrients for a Healthy Pregnancy",
      image: "/images/nutrition.jpg",
      author: "Dr. Jane Smith",
      upload_date: "2023-10-01",
    },
    {
      id: 2,
      title: "Managing Pregnancy Cravings Safely",
      image: "/images/nutrition2.jpg",
      author: "Dr. Emily Brown",
      upload_date: "2023-09-15",
    },
  ],
  "lifestyle-recommendations": [
    {
      id: 3,
      title: "Safe Exercise Tips for Expectant Mothers",
      image: "/images/lifestyle.jpg",
      author: "Dr. Sarah Johnson",
      upload_date: "2023-08-20",
    },
    {
      id: 4,
      title: "Improving Sleep During Pregnancy",
      image: "/images/lifestyle2.jpg",
      author: "Dr. Laura Green",
      upload_date: "2023-07-10",
    },
  ],
  "emotional-mental-health": [
    {
      id: 5,
      title: "Coping with Pregnancy Anxiety",
      image: "/images/emotional.jpg",
      author: "Dr. Maria Lopez",
      upload_date: "2023-06-05",
    },
    {
      id: 6,
      title: "Mindfulness for Expectant Moms",
      image: "/images/emotional2.jpg",
      author: "Dr. Anna White",
      upload_date: "2023-05-12",
    },
  ],
  "birth-preparation": [
    {
      id: 7,
      title: "Packing Your Hospital Bag",
      image: "/images/birth.jpg",
      author: "Dr. Rachel Lee",
      upload_date: "2023-04-18",
    },
    {
      id: 8,
      title: "Understanding Labor Stages",
      image: "/images/birth2.jpg",
      author: "Dr. Karen Davis",
      upload_date: "2023-03-25",
    },
  ],
};

const Blogs: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [blogs, setBlogs] = useState<any[]>([]);

  useEffect(() => {
    if (selectedCategory) {
      setBlogs(sampleBlogs[selectedCategory]);
    } else {
      setBlogs([]);
    }
  }, [selectedCategory]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <Layout>
      {/* Introductory Section */}
      <div
        className="bg-cover bg-center text-white py-16 px-4 text-center rounded-lg my-8"
        style={{ backgroundImage: "url('/images/pregnancy-bg.jpg')" }}
      >
        <h1 className="text-4xl font-bold mb-4 text-shadow-lg">
          Welcome to Maternal Care Blogs
        </h1>
        <p className="text-lg max-w-2xl mx-auto text-shadow-md">
          Pregnancy is a transformative journey. Explore our resources to support your health and well-being during this special time, with expert advice tailored to maternal care.
        </p>
      </div>

      {/* Categories Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold text-center mb-6 text-red-600">
          Blog Categories
        </h2>
        <div className="flex flex-wrap justify-around gap-4">
          <div
            onClick={() => handleCategoryClick("nutritional-counseling")}
            className="flex-1 min-w-[200px] max-w-[250px] h-36 flex items-center justify-center bg-white rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition cursor-pointer border border-red-200"
          >
            <h3 className="text-red-600 text-lg font-medium text-center">
              Nutritional Counseling
            </h3>
          </div>
          <div
            onClick={() => handleCategoryClick("lifestyle-recommendations")}
            className="flex-1 min-w-[200px] max-w-[250px] h-36 flex items-center justify-center bg-white rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition cursor-pointer border border-red-200"
          >
            <h3 className="text-red-600 text-lg font-medium text-center">
              Lifestyle Recommendations
            </h3>
          </div>
          <div
            onClick={() => handleCategoryClick("emotional-mental-health")}
            className="flex-1 min-w-[200px] max-w-[250px] h-36 flex items-center justify-center bg-white rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition cursor-pointer border border-red-200"
          >
            <h3 className="text-red-600 text-lg font-medium text-center">
              Emotional and Mental Health Support
            </h3>
          </div>
          <div
            onClick={() => handleCategoryClick("birth-preparation")}
            className="flex-1 min-w-[200px] max-w-[250px] h-36 flex items-center justify-center bg-white rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition cursor-pointer border border-red-200"
          >
            <h3 className="text-red-600 text-lg font-medium text-center">
              Birth Preparation Guidance
            </h3>
          </div>
        </div>
      </div>

      {/* Blog Section */}
      {selectedCategory && (
        <div className="bg-gray-50 p-4 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-center mb-6 text-red-600">
            {selectedCategory.replace(/-/g, " ").toUpperCase()}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition border border-red-100"
              >
                <Link to={`/blog/${blog.id}`}>
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h3 className="text-red-600 text-lg font-medium mb-2">
                    {blog.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-1">
                    Author: {blog.author}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Upload Date: {new Date(blog.upload_date).toLocaleDateString()}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Blogs;