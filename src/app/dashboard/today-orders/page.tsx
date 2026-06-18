"use client";

import { useState } from "react";
import { Search, Eye, Filter, FilterX } from "lucide-react";

interface Order {
  id: string;
  type: string;
  vehicle: string;
  date: string;
  pickupTime: string;
  dropoffTime: string;
  passenger: string;
  pickupAddress: string;
  status: "Scheduled" | "In Progress" | "Completed";
}

const SEED_ORDERS: Order[] = [
  {
    id: "ORD-101",
    type: "WC",
    vehicle: "Wheelchair Van",
    date: "Today",
    pickupTime: "08:00 AM",
    dropoffTime: "08:45 AM",
    passenger: "John Smith",
    pickupAddress: "123 Main St, Buffalo, NY",
    status: "Scheduled",
  },
  {
    id: "ORD-102",
    type: "UA",
    vehicle: "Sedan",
    date: "Today",
    pickupTime: "08:30 AM",
    dropoffTime: "09:15 AM",
    passenger: "Emily Johnson",
    pickupAddress: "456 Elmwood Ave, Buffalo, NY",
    status: "In Progress",
  },
  {
    id: "ORD-103",
    type: "WC",
    vehicle: "Wheelchair Van",
    date: "Today",
    pickupTime: "09:00 AM",
    dropoffTime: "09:50 AM",
    passenger: "Michael Brown",
    pickupAddress: "78 Delaware Ave, Buffalo, NY",
    status: "Scheduled",
  },
  {
    id: "ORD-104",
    type: "UA",
    vehicle: "SUV",
    date: "Today",
    pickupTime: "09:30 AM",
    dropoffTime: "10:10 AM",
    passenger: "Sarah Davis",
    pickupAddress: "900 Niagara St, Buffalo, NY",
    status: "Completed",
  },
];

export default function TodayOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [pickupFilter, setPickupFilter] = useState("All");
  const [dropoffFilter, setDropoffFilter] = useState("All");

  const handleClear = () => {
    setSearch("");
    setStatusFilter("All");
    setPickupFilter("All");
    setDropoffFilter("All");
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      search === "" ||
      o.passenger.toLowerCase().includes(search.toLowerCase()) ||
      o.pickupAddress.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || o.status === statusFilter;
    const matchesPickup = pickupFilter === "All" || o.pickupTime.includes(pickupFilter);
    const matchesDropoff = dropoffFilter === "All" || o.dropoffTime.includes(dropoffFilter);

    return matchesSearch && matchesStatus && matchesPickup && matchesDropoff;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Today's Orders
        </h1>
        <p className="text-sm mt-1 text-slate-500 font-medium">
          {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"} for today
        </p>
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col md:flex-row md:items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by address or passenger"
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 placeholder:text-slate-400"
          />
        </div>

        {/* Filters Grid */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Filter */}
          <div className="flex flex-col min-w-[120px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Pickup Filter */}
          <div className="flex flex-col min-w-[120px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Pickup Time
            </span>
            <select
              value={pickupFilter}
              onChange={(e) => setPickupFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="All">All</option>
              <option value="08:00 AM">08:00 AM</option>
              <option value="08:30 AM">08:30 AM</option>
              <option value="09:00 AM">09:00 AM</option>
              <option value="09:30 AM">09:30 AM</option>
            </select>
          </div>

          {/* Dropoff Filter */}
          <div className="flex flex-col min-w-[120px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Drop-off Time
            </span>
            <select
              value={dropoffFilter}
              onChange={(e) => setDropoffFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="All">All</option>
              <option value="08:45 AM">08:45 AM</option>
              <option value="09:15 AM">09:15 AM</option>
              <option value="09:50 AM">09:50 AM</option>
              <option value="10:10 AM">10:10 AM</option>
            </select>
          </div>

          {/* Clear Button */}
          <div className="flex flex-col pt-4">
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-4 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <FilterX size={15} />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {[
                  "Order ID",
                  "Type",
                  "Vehicle",
                  "Date",
                  "Pickup",
                  "Drop-off",
                  "Passenger",
                  "Pickup Address",
                  "Status",
                  "Details",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Order ID */}
                    <td className="px-6 py-4.5 text-sm font-bold text-blue-600 whitespace-nowrap">
                      {order.id}
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4.5 text-sm font-semibold text-slate-600 whitespace-nowrap">
                      {order.type}
                    </td>

                    {/* Vehicle */}
                    <td className="px-6 py-4.5 text-sm font-semibold text-slate-700 whitespace-nowrap">
                      {order.vehicle}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4.5 text-sm font-semibold text-slate-500 whitespace-nowrap">
                      {order.date}
                    </td>

                    {/* Pickup */}
                    <td className="px-6 py-4.5 text-sm font-bold text-slate-700 whitespace-nowrap">
                      {order.pickupTime}
                    </td>

                    {/* Drop-off */}
                    <td className="px-6 py-4.5 text-sm font-bold text-slate-700 whitespace-nowrap">
                      {order.dropoffTime}
                    </td>

                    {/* Passenger */}
                    <td className="px-6 py-4.5 text-sm font-extrabold text-slate-800 whitespace-nowrap">
                      {order.passenger}
                    </td>

                    {/* Pickup Address */}
                    <td className="px-6 py-4.5 text-sm font-medium text-slate-600 max-w-[200px] truncate">
                      {order.pickupAddress}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                          order.status === "Scheduled"
                            ? "bg-amber-100 text-amber-800"
                            : order.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors">
                        <Eye size={13} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-12 text-center text-sm font-medium text-slate-400"
                  >
                    No orders found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-3">
          <p className="text-xs font-medium text-slate-400">
            Showing {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}
          </p>
        </div>
      </div>
    </div>
  );
}
