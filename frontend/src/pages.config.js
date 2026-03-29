import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import ManufacturingOrders from './pages/ManufacturingOrders';
import ManufacturingOrderDetails from './pages/ManufacturingOrderDetails';
import Workstations from './pages/Workstations';
import Stock from './pages/Stock';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import DeliveryNotes from './pages/DeliveryNotes';
import DeliveryNoteDetails from './pages/DeliveryNoteDetails';
import Invoices from './pages/Invoices';
import InvoiceDetails from './pages/InvoiceDetails';
import Suppliers from './pages/Suppliers';
import SupplierDetails from './pages/SupplierDetails';
import Users from './pages/Users';
import Login from './pages/Login';
import Quotes from './pages/Quotes';
import QuoteDetails from './pages/QuoteDetails';
import CreditNotes from './pages/CreditNotes';
import CreditNoteDetails from './pages/CreditNoteDetails';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Products": Products,
    "ProductDetails": ProductDetails,
    "ManufacturingOrders": ManufacturingOrders,
    "ManufacturingOrderDetails": ManufacturingOrderDetails,
    "Workstations": Workstations,
    "Stock": Stock,
    "Customers": Customers,
    "CustomerDetails": CustomerDetails,
    "Orders": Orders,
    "OrderDetails": OrderDetails,
    "DeliveryNotes": DeliveryNotes,
    "DeliveryNoteDetails": DeliveryNoteDetails,
    "Invoices": Invoices,
    "InvoiceDetails": InvoiceDetails,
    "Suppliers": Suppliers,
    "SupplierDetails": SupplierDetails,
    "Users": Users,
    "Login": Login,
    "Quotes": Quotes,
    "QuoteDetails": QuoteDetails,
    "CreditNotes": CreditNotes,
    "CreditNoteDetails": CreditNoteDetails,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
