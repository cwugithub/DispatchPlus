package dispatchPlus.entity;

public class AddOrderRequestBody {
    private int status;

    private long departureTime;

    private long pickUpTime;

    private long deliveryTime;

    private long arriveTime;

    private String pickUpAddress;

    private String deliveryAddress;

    private double price;

    private int deviceType;

    private String description;

    private String path;

    private String stationMarkers;

    private String pickUpMarker;

    private String deliveryMarker;

    private int StationIdx;

    private int devOption;

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public long getDepartureTime() {
        return departureTime;
    }

    public void setDepartureTime(long departureTime) {
        this.departureTime = departureTime;
    }

    public long getPickUpTime() {
        return pickUpTime;
    }

    public void setPickUpTime(long pickUpTime) {
        this.pickUpTime = pickUpTime;
    }

    public long getDeliveryTime() {
        return deliveryTime;
    }

    public void setDeliveryTime(long deliveryTime) {
        this.deliveryTime = deliveryTime;
    }

    public long getArriveTime() {
        return arriveTime;
    }

    public void setArriveTime(long arriveTime) {
        this.arriveTime = arriveTime;
    }

    public String getPickUpAddress() {
        return pickUpAddress;
    }

    public void setPickUpAddress(String pickUpAddress) {
        this.pickUpAddress = pickUpAddress;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public int getDeviceType() {
        return deviceType;
    }

    public void setDeviceType(int deviceType) {
        this.deviceType = deviceType;
    }

    public String getDescription() { return description; }

    public void setDescription(String description) { this.description = description; }

    public String getPath() { return path; }

    public void setPath(String path) { this.path = path; }

    public String getStationMarkers() { return stationMarkers; }

    public void setStationMarkers(String stationMarkers) { this.stationMarkers = stationMarkers; }

    public String getPickUpMarker() { return pickUpMarker; }

    public void setPickUpMarker(String pickUpMarker) { this.pickUpMarker = pickUpMarker; }

    public String getDeliveryMarker() { return deliveryMarker; }

    public void setDeliveryMarker(String deliveryMarker) { this.deliveryMarker = deliveryMarker; }

    public int getStationIdx() { return StationIdx; }

    public void setStationIdx(int stationIdx) { StationIdx = stationIdx; }

    public int getDevOption() { return devOption; }

    public void setDevOption(int devOption) { this.devOption = devOption; }
}
