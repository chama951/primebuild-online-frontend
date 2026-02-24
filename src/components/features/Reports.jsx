import React, {useState, useEffect} from "react";
import {
    useGetPaymentsQuery,
    useGetPaymentsByDateQuery,
    useGetPaymentsByStatusQuery,
    useGetPaymentsByUsernameQuery,
} from "../../features/components/paymentApi.js";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import {
    Download,
    Calendar,
    Filter,
    DollarSign,
    BarChart3,
    CreditCard,
    TrendingUp
} from "lucide-react";
import Unauthorized from "../common/Unauthorized.jsx";

const Reports = ({refetchFlag, resetFlag}) => {


    return (
        <div>

        </div>
    );
};

export default Reports;