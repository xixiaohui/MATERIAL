#!/bin/bash

# 定义所有要安装的组件
components=(
  accordion
  alert
  alert-dialog
  aspect-ratio
  avatar
  badge
  button
  breadcrumb
  calendar
  card
  carousel
  chart
  checkbox
  collapsible
  command
  context-menu
  data-table
  date-picker
  dialog
  dropdown-menu
  drawer
  form
  hover-card
  input
  input-otp
  label
  menubar
  navigation-menu
  pagination
  popover
  progress
  radio-group
  resizable
  scroll-area
  select
  separator
  sheet
  sidebar
  skeleton
  slider
  sonner
  switch
  table
  tabs
  textarea
  toast
  toggle
  toggle-group
  tooltip
)

# 循环安装所有组件
for component in "${components[@]}"; do
  echo "Installing $component..."
  npx shadcn@latest add "$component"
done

echo "All components have been installed successfully!"
