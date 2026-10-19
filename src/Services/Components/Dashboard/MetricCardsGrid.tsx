import React from "react";
import { BsChatDotsFill } from "react-icons/bs";
import { FaCartShopping, FaFileInvoiceDollar, FaUserClock } from "react-icons/fa6";
import { IoSyncCircle } from "react-icons/io5";
import { MdAttachMoney, MdTimer,MdTimelapse } from "react-icons/md";
import MetricCard from "./MetricCard";
import type { DashboardIndicatorsProj } from "@/Interfaces/Dashboard/PerformanceDashboardInterfaces";
import "@/Styles/Dashboard/PerformanceDashboard.css";
import { formatCurrencyNIO, formatDateTimeNI } from "@/Utils/ECommerce/formatters";

interface MetricCardsGridProps {
  indicators: DashboardIndicatorsProj | null;
  loading?: boolean;
}

const MetricCardsGrid: React.FC<MetricCardsGridProps> = ({ indicators, loading }) => {
  if (loading) {
    return (
      <section className="metric-grid">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="metric-card metric-card--skeleton" />
        ))}
      </section>
    );
  }

  return (
    <section className="metric-grid">
      <MetricCard
        title="Conversaciones"
        value={indicators?.conversacionesCantidad ?? 0}
        subtitle="Total conversaciones"
        icon={<BsChatDotsFill />}
        variant="blue"
      />

     <MetricCard
        title="Últ. Conversación"
        value={formatDateTimeNI(indicators?.lastConversationCreatedAt)}
        subtitle="Última conversación"
        icon={<MdTimelapse />}
        variant="pink"
      />

      <MetricCard
        title="Tiempo primera respuesta"
        value={`${indicators?.tiempoPrimeraRespuestaMinutos ?? 0} min`}
        subtitle="Promedio"
        icon={<MdTimer />}
        variant="purple"
      />

      <MetricCard
        title="Cliente potencial"
        value={indicators?.clientePotencialCantidad ?? 0}
        subtitle="Contactos"
        icon={<FaUserClock />}
        variant="orange"
      />

      <MetricCard
        title="Cliente en seguimiento"
        value={indicators?.clienteSeguimientoCantidad ?? 0}
        subtitle="Contactos"
        icon={<IoSyncCircle />}
        variant="cyan"
      />

      <MetricCard
        title="Cliente en venta"
        value={indicators?.clienteVentaCantidad ?? 0}
        subtitle="Contactos"
        icon={<FaCartShopping />}
        variant="teal"
      />

      <MetricCard
        title="Venta total"
        value={formatCurrencyNIO(indicators?.ventaTotal)}
        subtitle="En dinero"
        icon={<MdAttachMoney />}
        variant="money"
      />

      <MetricCard
        title="Nivel de servicio"
        value={`${indicators?.nivelServicio ?? 0}%`}
        subtitle="Proformas / Conversaciones"
        icon={<FaFileInvoiceDollar />}
        variant="green"
      />
    </section>
  );
};

export default MetricCardsGrid;