import {Navigate} from "react-router-dom";

const PrivateRoute = ({children}) => {
    const token = localStorage.getItem("jwtToken");
    const roles = JSON.parse(localStorage.getItem("roles") || "[]");

    if (!token) {
        return <Navigate to="/login" replace/>;
    }

    const isOnlyCustomer =
        roles.length === 1 && roles.includes("CUSTOMER");

    if (isOnlyCustomer) {
        return <Navigate to="/home" replace/>;
    }

    return children;
};

export default PrivateRoute;