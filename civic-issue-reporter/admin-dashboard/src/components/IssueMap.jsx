import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Box, Button } from "@mui/material";

// Custom icons by status
const iconColors = {
  resolved: "green",
  in_progress: "orange",
  submitted: "red",
};
function getCustomIcon(status) {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${iconColors[status] || "blue"}.png`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
    shadowSize: [41, 41],
  });
}

const IssueMap = ({ issues, onView, onAssign }) => {
  const center = [23.6102, 85.2799];
  const markers = (issues || []).filter(
    (issue) =>
      issue.location &&
      typeof issue.location.lat === "number" &&
      typeof issue.location.lng === "number",
  );

  return (
    <Box sx={{ height: 400, width: "100%" }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((issue) => (
          <Marker
            key={issue.id}
            position={[issue.location.lat, issue.location.lng]}
            icon={getCustomIcon(issue.status)}
          >
            <Popup>
              <strong>{issue.category}</strong>
              <br />
              Status: {issue.status}
              <br />
              Reported:{" "}
              {issue.createdAt
                ? new Date(issue.createdAt).toLocaleString()
                : ""}
              <br />
              {issue.description && (
                <>
                  <em>{issue.description}</em>
                  <br />
                </>
              )}
              {issue.photoUrl && (
                <img
                  src={issue.photoUrl}
                  alt="Issue"
                  style={{ width: 120, marginTop: 8, borderRadius: 4 }}
                />
              )}
              <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onView && onView(issue)}
                >
                  View
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="secondary"
                  onClick={() => onAssign && onAssign(issue)}
                >
                  Assign
                </Button>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
};

export default IssueMap;
