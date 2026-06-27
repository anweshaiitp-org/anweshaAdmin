import { 
  FiShield,
  FiUser, 
  FiCalendar, 
  FiHome, 
  FiCreditCard, 
  FiAward, 
  FiRadio 
} from "react-icons/fi";

export const sidebarItems = [
  { name: "Dashboard", icon: FiShield, path: "/admin" }, 
  { name: "User", icon: FiUser, path: "/admin/users" },
  { name: "Events", icon: FiCalendar, path: "/admin/events" },
  { name: "Accommodation", icon: FiHome, path: "/admin/accommodation" },
  { name: "Payments", icon: FiCreditCard, path: "/admin/payments" },
  { name: "Campus Ambassador", icon: FiAward, path: "/admin/ca" },
  { name: "Broadcast", icon: FiRadio, path: "/admin/broadcast" },
];