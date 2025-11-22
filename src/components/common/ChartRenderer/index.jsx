import React from "react";
import {
    LineChart, Line,
    BarChart, Bar,
    AreaChart, Area,
    PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer
} from "recharts";

const DEFAULT_COLORS = ["#6C63FF", "#FF6B6B", "#4ECDC4", "#FFD93D", "#1A535C"];

const ChartRenderer = ({
    type = "line",
    data = [],
    dataKeyX = "name",
    dataKeyY = "value",
    colors = DEFAULT_COLORS,
    seriesName = "Value",  
}) => {

    if (!data || data.length === 0) {
        return <p style={{ textAlign: "center", margin: "20px 0" }}>No data available</p>;
    }

    const mainColor = colors[0] || DEFAULT_COLORS[0];
    const CHART_HEIGHT = 300;

    return (
        <div
            style={{
                width: "100%",
                height: CHART_HEIGHT,
                minHeight: `${CHART_HEIGHT}px`,
                padding: 0,
                margin: 0,
            }}
        >
            <ResponsiveContainer width="100%" height="100%">

                {/* LINE CHART */}
                {type === "line" && (
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={dataKeyX} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey={dataKeyY}
                            name={seriesName}  
                            stroke={mainColor}
                            strokeWidth={2}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                )}

                {/* BAR CHART */}
                {type === "bar" && (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={dataKeyX} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                            dataKey={dataKeyY}
                            name={seriesName} 
                            fill={mainColor}
                            radius={[8, 8, 0, 0]}
                        />
                    </BarChart>
                )}

                {/* AREA CHART */}
                {type === "area" && (
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={mainColor} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={mainColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={dataKeyX} />
                        <YAxis />
                        <Tooltip />
                        <Legend />

                        <Area
                            type="monotone"
                            dataKey={dataKeyY}
                            name={seriesName} 
                            stroke={mainColor}
                            fillOpacity={1}
                            fill="url(#colorGradient)"
                        />
                    </AreaChart>
                )}

                {/* PIE CHART */}
                {type === "pie" && (
                    <PieChart>
                        <Tooltip />
                        <Legend />
                        <Pie
                            data={data}
                            dataKey={dataKeyY}
                            nameKey={dataKeyX}
                            name={seriesName}    
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                        >
                            {data.map((_, i) => (
                                <Cell key={i} fill={colors[i % colors.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                )}

            </ResponsiveContainer>
        </div>
    );
};

export default ChartRenderer;


{/* 

// Example Usage:
<ChartRenderer type="bar" data={chartData} colors={["var(--theme)"]} />
<ChartRenderer type="line" data={chartData} />
<ChartRenderer type="area" data={chartData} />
<ChartRenderer type="pie" data={chartData} /> 

*/}