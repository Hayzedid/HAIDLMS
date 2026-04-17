interface StreakCalendarProps {
  data: Array<{
    date: string;
    activity_count: number;
    lessons_completed: number;
  }>;
  title?: string;
}

export default function StreakCalendar({
  data,
  title = "Learning Activity",
}: StreakCalendarProps) {
  // Sort data by date
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Get max activity for color scaling
  const maxActivity = Math.max(...sortedData.map((d) => d.activity_count), 1);

  // Group by weeks
  const weeks: Array<typeof sortedData> = [];
  let currentWeek: typeof sortedData = [];

  sortedData.forEach((item) => {
    currentWeek.push(item);
    const dayOfWeek = new Date(item.date).getDay();
    if (dayOfWeek === 6 || item === sortedData[sortedData.length - 1]) {
      // Saturday or last item
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  const getActivityColor = (count: number): string => {
    if (count === 0) return "#f3f4f6";
    const intensity = count / maxActivity;
    if (intensity > 0.75) return "#10b981";
    if (intensity > 0.5) return "#34d399";
    if (intensity > 0.25) return "#6ee7b7";
    return "#a7f3d0";
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
      }}
    >
      <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
        {title}
      </h3>

      <div style={{ overflowX: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${weeks.length}, minmax(40px, 1fr))`,
            gap: "4px",
            minWidth: "fit-content",
          }}
        >
          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              style={{
                display: "grid",
                gridTemplateRows: "repeat(7, 1fr)",
                gap: "4px",
              }}
            >
              {week.map((day, dayIndex) => {
                const color = getActivityColor(day.activity_count);
                const hasActivity = day.activity_count > 0;

                return (
                  <div
                    key={dayIndex}
                    style={{
                      width: "32px",
                      height: "32px",
                      backgroundColor: color,
                      borderRadius: "4px",
                      border: hasActivity
                        ? "1px solid #059669"
                        : "1px solid #e5e7eb",
                      cursor: hasActivity ? "pointer" : "default",
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    title={`${formatDate(day.date)}\nActivity: ${day.activity_count}\nLessons: ${day.lessons_completed}`}
                    onMouseEnter={(e) => {
                      if (hasActivity) {
                        e.currentTarget.style.transform = "scale(1.1)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(0,0,0,0.15)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginTop: "16px",
          fontSize: "12px",
          color: "#6b7280",
        }}
      >
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((intensity, index) => (
          <div
            key={index}
            style={{
              width: "16px",
              height: "16px",
              backgroundColor: getActivityColor(intensity * maxActivity),
              borderRadius: "2px",
              border: "1px solid #e5e7eb",
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
