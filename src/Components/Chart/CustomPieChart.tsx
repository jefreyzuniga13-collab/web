/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type {
  ConversationRatingByAgents,
  ConversationStatusCountResponseDto,
} from "@/Interfaces/Dashboard/DashboardInterfaces";
import "@/Styles/Dashboard/CustomPieChart.css";
import type { StateTranslation } from "@/Interfaces/GlobalInterface";
import { stateTranslations } from "@/Utils/Translation/stateTranslations";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import { useUsers } from "@/Hooks/User/useUsers";

const COLORS = [
  "#0070B4",
  "#10b981",
  "#f59e0b",
  "#dc2626",
  "#645957ff",
  "#3bb2f6ff",
  "#9ca3af",
];

interface Props {
  data: ConversationStatusCountResponseDto[] | ConversationRatingByAgents[] | null;
  filterableByAgent?: boolean;
  enableNavigation?: boolean;
  selectedAgentId?: number | null;
  setSelectedAgentId?: (agentId: number | null) => void;
  fetchRatingByAgent?: (agentId: number | null, pg: number, ps: number) => Promise<void>;
}

export default function CustomPieChart({
  data,
  filterableByAgent = false,
  enableNavigation = true,
  selectedAgentId = null,
  setSelectedAgentId,
  fetchRatingByAgent,
}: Props) {
  // const navigate = useNavigate();
  const { agents, getAgents } = useUsers();

  useEffect(() => {
    if (filterableByAgent) {
      getAgents();
    }
  }, [filterableByAgent, getAgents]);

  let filteredData = data;

  if (
    filterableByAgent &&
    selectedAgentId &&
    data &&
    data.length > 0 &&
    (data[0] as any).agentId !== undefined
  ) {
    filteredData = (data as ConversationRatingByAgents[]).filter(
      (item) => item.agentId === selectedAgentId.toString()
    );
  }

  const isRatingByAgent = data && data[0] && (data[0] as any).excelentRatings !== undefined;

  const chartData = isRatingByAgent
    ? [
        {
          name: "Excelente",
          value: (filteredData as ConversationRatingByAgents[]).reduce(
            (acc, cur) => acc + cur.excelentRatings,
            0
          ),
        },
        {
          name: "Regular",
          value: (filteredData as ConversationRatingByAgents[]).reduce(
            (acc, cur) => acc + cur.regularRatings,
            0
          ),
        },
        {
          name: "Negativo",
          value: (filteredData as ConversationRatingByAgents[]).reduce(
            (acc, cur) => acc + cur.negativeRatings,
            0
          ),
        },
      ]
    : filteredData?.map((item) => ({
        name: (item as any).status,
        value: (item as any).count,
      })) ?? [];

  const RADIAN = Math.PI / 180;

  const renderAllLabels = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
    payload,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const xPercent = cx + radius * Math.cos(-midAngle * RADIAN);
    const yPercent = cy + radius * Math.sin(-midAngle * RADIAN);
    const outerOffset = outerRadius + 20;
    const xName = cx + outerOffset * Math.cos(-midAngle * RADIAN);
    const yName = cy + outerOffset * Math.sin(-midAngle * RADIAN);

    return (
      <g>
        <text
          x={xPercent}
          y={yPercent}
          fill="white"
          textAnchor={xPercent > cx ? "start" : "end"}
          dominantBaseline="central"
          fontSize={12}
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
        <text
          x={xName}
          y={yName}
          fill={COLORS[index % COLORS.length]}
          textAnchor={xName > cx ? "start" : "end"}
          dominantBaseline="central"
          fontSize={12}
        >
          {stateTranslations[payload.name as StateTranslation] || payload.name}
        </text>
      </g>
    );
  };

  const handleClick = (entry: any) => {
    if (!enableNavigation) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const status = entry.name;
    // navigate(`/conversation/${encodeURIComponent(status)}`);
  };

  return (
    <div className="pieChart__container">
      {filterableByAgent && (
        <FormControl fullWidth size="small" style={{ marginBottom: "1rem" }}>
          <InputLabel>Agente</InputLabel>
          <Select
            value={selectedAgentId !== null ? selectedAgentId.toString() : ""}
            label="Agente"
            onChange={(e) => {
              const value = e.target.value as string;
              const selected = value === "" ? null : parseInt(value, 10);
              setSelectedAgentId?.(selected);
              fetchRatingByAgent?.(selected, 1, 5);
            }}
            sx={{ maxWidth: "40%", maxHeight: "40px", minHeight: "40px" }}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 200,
                },
              },
            }}
          >
            <MenuItem value="" sx={{ fontSize: "1.2rem" }}>
              Todos
            </MenuItem>
            {agents.slice(0, 5).map((agent) => (
              <MenuItem key={agent.userId} value={agent.userId.toString()} sx={{ fontSize: "1.2rem" }}>
                {agent.fullName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={100}
              labelLine={true}
              label={renderAllLabels}
              onClick={handleClick}
            >
              {chartData.map((_, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(val: number) => [`${val}`, "Cantidad"]} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="no-data-message">No hay datos para mostrar.</div>
      )}
    </div>
  );
}