"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/services")
      .then((res) => res.json())
      .then((data) => {
        setServices(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching services:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-xl text-sky-400 animate-pulse">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Our Professional Services
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            Explore our wide range of on-demand device and home appliance repair services tailored to meet your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services?.map((service) => (
            <div
              key={service._id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col justify-between transition hover:border-slate-700"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden bg-slate-800">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 right-3 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold px-3 py-1 rounded-full">
                    {service.category}
                  </span>
                </div>

                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2 text-white">
                    {service.title}
                  </h2>
                  <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                    {service.description}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-800/60 mt-4">
                <span className="text-xl font-bold text-sky-400">
                  ${service.price}
                </span>
                <Link
                  href={`/services/${service._id}`}
                  className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}