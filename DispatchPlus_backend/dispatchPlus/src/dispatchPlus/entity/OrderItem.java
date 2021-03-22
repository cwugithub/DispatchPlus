package dispatchPlus.entity;

import java.io.Serializable;
import javax.persistence.*;
import javax.validation.constraints.Size;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "OrderItems")
public class OrderItem implements Serializable {

    private static final long serialVersionUID = -2455760938054036364L;

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    @ManyToOne
    @JsonIgnore
    private Cart cart;

    // order status code
    // 0: order is not placed
    // 1: order is placed and device has not departed
    // 2: order is placed and device is on the way of picking up package
    // 3: order is placed and device is on the way of delivering
    // 4: order is complete and device is on the way back to station
    // 5: order is complete and device returned to station
    private int status;

    private long departureTime;

    private long pickUpTime;

    private long deliveryTime;

    private long arriveTime;

    private String pickUpAddress;

    private String deliveryAddress;

    private double price;

    private int deviceId;

    private String description;

    @Column(length = 4096)
    @Size(min = 0, max = 4096)
    private String path;

    private String stationMarkers;

    private String pickUpMarker;

    private String deliveryMarker;

    private int StationIdx;

    private int devOption;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public Cart getCart() {
        return cart;
    }

    public void setCart(Cart cart) {
        this.cart = cart;
    }

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

    public int getDeviceId() { return deviceId; }

    public void setDeviceId(int deviceId) { this.deviceId = deviceId; }

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