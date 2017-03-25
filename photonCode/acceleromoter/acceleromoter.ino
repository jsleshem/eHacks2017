// Author Jack Leshem
#include <Arduino.h>
#include <Wire.h>
#include <ST7036.h>
#include <Adafruit_MMA8451.h>
#include <Adafruit_Sensor.h>


Adafruit_MMA8451 mma = Adafruit_MMA8451();
ST7036 lcd = ST7036 ( 2, 16, 0x7c );
long previousMillis = 0;
long interval = 100;
int threshHold = 1.25;

void setup(void) {
   Serial.begin(115200);
  
  Serial.println("Adafruit MMA8451 test!");

  lcd.init();
  lcd.setContrast(0);  
  lcd.setCursor(0,0);

  if (! mma.begin()) {
    Serial.println("Couldnt start");
    lcd.print("Couldnt start");
    while (1);
  }
  Serial.println("MMA8451 found!");
  
  mma.setRange(MMA8451_RANGE_8_G);
  
  Serial.print("Range = "); Serial.print(2 << mma.getRange());  
  Serial.println("G");
}

void loop() {
  mma.read();
  sensors_event_t event; 
  mma.getEvent(&event);


  float xAccel = abs(event.acceleration.x);
  float yAccel = abs(event.acceleration.y);
  float zAccel= abs(event.acceleration.z);
  float totalAccel = xAccel + yAccel + zAccel;

  if (totalAccel > threshHold) {
    Serial.println("moving");
  }
  else  {
    Serial.println("Still");
  }
 delay(100);
}
