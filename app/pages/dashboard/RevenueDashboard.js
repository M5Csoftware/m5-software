import React, { useContext, useEffect, useState } from "react";
import Image from "next/image";
import DashboardTopListCard from "./DashboardTopListCard";
import HubWise from "./DashboardHubWise";
import DashboardSummaryCard from "./DashboardSummaryCard";
import DashboardSectorWise from "./DashboardSectorWise";
import DashboardStateWise from "./DashboardStateWise";
import DashboardTopSector from "./DashboardTopSector";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";

function RevenueDashboard() {
  const currentDate = new Date();
  const currentYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const { server } = useContext(GlobalContext)

  const [monthlyRevenueData, setMonthlyRevenueData] = useState({
    [currentYearMonth]: {
      value1: { label: "Revenue", amount: 0 },
      value2: { label: "Weight", amount: 0 },
    }
  });
  const [monthlyOutstandingData, setMonthlyOutstandingData] = useState({
    [currentYearMonth]: {
      value1: { label: "Outstanding", amount: 0 },
      value2: { label: "Total Sales", amount: 0 },
    }
  });


  const [monthlyStateData, setMonthlyStateData] = useState({
    [currentYearMonth]: []
  });
  const [monthlySectorData, setMonthlySectorData] = useState({
    [currentYearMonth]: []
  });
  const [hubWiseData, setHubWiseData] = useState({
    [currentYearMonth]: []
  });
  const [topCustomersData, setTopCustomersData] = useState([]);
  const [topSalesPersonsData, setTopSalesPersonsData] = useState([]);

  const [topSectorsData, setTopSectorsData] = useState([
    { weight: 0, city: "London", sector: "UK", code: "UK" },
    { weight: 0, city: "Vancouver", sector: "Canada", code: "CA" },
    { weight: 0, city: "California", sector: "USA", code: "USA" },
    { weight: 0, city: "Sydney", sector: "Australia", code: "AUS" },
    { weight: 0, city: "Wellington", sector: "New Zeland", code: "NZ" },
    { weight: 0, city: "Paris", sector: "Europe", code: "EU" },
  ]);


  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const response = await axios.get(`${server}/dashboard/revenue-dashboard-data`);

        if (response.status === 200) {
          const data = response.data;

          setMonthlyRevenueData(data.monthlyRevenueData || {
            [currentYearMonth]: {
              value1: { label: "Revenue", amount: 0 },
              value2: { label: "Weight", amount: 0 },
            }
          });
          setMonthlyOutstandingData(data.monthlyOutstandingData || {
            [currentYearMonth]: {
              value1: { label: "Outstanding", amount: 0 },
              value2: { label: "Total Sales", amount: 0 },
            }
          });

          setMonthlyStateData(data.monthlyStateData || {
            [currentYearMonth]: []
          });

          setMonthlySectorData(data.monthlySectorData || {
            [currentYearMonth]: []
          });
          setHubWiseData(data.hubWiseData || {
            [currentYearMonth]: []
          });

          setTopSectorsData(data.topSectorsData || [
            { weight: 0, city: "London", sector: "UK", code: "UK" },
            { weight: 0, city: "Vancouver", sector: "Canada", code: "CA" },
            { weight: 0, city: "California", sector: "USA", code: "USA" },
            { weight: 0, city: "Sydney", sector: "Australia", code: "AUS" },
            { weight: 0, city: "Wellington", sector: "New Zeland", code: "NZ" },
            { weight: 0, city: "Paris", sector: "Europe", code: "EU" },
          ]);
          setTopCustomersData(data.topCustomersData || [])
          setTopSalesPersonsData(data.topSalesPersonsData || [])

        } else {
          // fallback defaults
          setMonthlyRevenueData({
            [currentYearMonth]: {
              value1: { label: "Revenue", amount: 0 },
              value2: { label: "Weight", amount: 0 },
            }
          });
          setMonthlyOutstandingData({
            [currentYearMonth]: {
              value1: { label: "Outstanding", amount: 0 },
              value2: { label: "Total Sales", amount: 0 },
            }
          });
          setMonthlyStateData({ [currentYearMonth]: [] });
          setMonthlySectorData({ [currentYearMonth]: [] });
          setHubWiseData({ [currentYearMonth]: [] });
          setTopSectorsData([
            { weight: 0, city: "London", sector: "UK", code: "UK" },
            { weight: 0, city: "Vancouver", sector: "Canada", code: "CA" },
            { weight: 0, city: "California", sector: "USA", code: "USA" },
            { weight: 0, city: "Sydney", sector: "Australia", code: "AUS" },
            { weight: 0, city: "Wellington", sector: "New Zeland", code: "NZ" },
            { weight: 0, city: "Paris", sector: "Europe", code: "EU" },
          ]);
          setTopCustomersData([])
          setTopSalesPersonsData([])
        }
      } catch (error) {
        console.error("Error fetching monthly data:", error);

        setMonthlyRevenueData({
          [currentYearMonth]: {
            value1: { label: "Revenue", amount: 0 },
            value2: { label: "Weight", amount: 0 },
          }
        });
        setMonthlyOutstandingData({
          [currentYearMonth]: {
            value1: { label: "Outstanding", amount: 0 },
            value2: { label: "Total Sales", amount: 0 },
          }
        });
        setMonthlyStateData({ [currentYearMonth]: [] });
        setMonthlySectorData({ [currentYearMonth]: [] });
        setHubWiseData({ [currentYearMonth]: [] });
        setTopSectorsData([
          { weight: 0, city: "London", sector: "UK", code: "UK" },
          { weight: 0, city: "Vancouver", sector: "Canada", code: "CA" },
          { weight: 0, city: "California", sector: "USA", code: "USA" },
          { weight: 0, city: "Sydney", sector: "Australia", code: "AUS" },
          { weight: 0, city: "Wellington", sector: "New Zeland", code: "NZ" },
          { weight: 0, city: "Paris", sector: "Europe", code: "EU" },
        ]);
        setTopCustomersData([])
        setTopSalesPersonsData([])

      }
    };

    fetchMonthlyData();
  }, []);

  return (

    <div className="flex gap-7 flex-grow w-full">
      <div className="flex flex-col gap-6">
        <div className="flex gap-4">
          <DashboardSummaryCard
            title="TOTAL REVENUE"
            monthlyData={monthlyRevenueData}
            server={server}
            />
          <DashboardSummaryCard
            title="OUTSTANDING"
            monthlyData={monthlyOutstandingData}
            server={server}
          />
        </div>
        <div className="flex gap-8">
          <DashboardStateWise data={monthlyStateData} />
          <div className="flex flex-col gap-3">
            <HubWise monthlyData={hubWiseData} />
            <DashboardTopSector data={topSectorsData} />

          </div>
        </div>
        <DashboardSectorWise data={monthlySectorData} />
      </div>
      <div className="flex flex-col gap-6 flex-grow justify-between">
        <DashboardTopListCard
          city={`New Delhi`}
          title={`Top Sales Person`}
          data={topSalesPersonsData}
        />
        <DashboardTopListCard
          city={`New Delhi`}
          title={`Top Customers`}
          data={topCustomersData}
        />
      </div>
    </div>
  );
}

export default RevenueDashboard;
