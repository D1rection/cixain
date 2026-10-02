---
title: DLSYS-HW0 记录
date: 2026-09-29
updated: 2026-09-29
description: CMU10-414 实验0记录
category: Tech
showOnHome: true
tags:
  - CMU10-414
  - 机器学习
draft: true
series: CMU10-414 ML系统
seriesIndex: 2
---
本作业要求实现一个基础的 softmax 回归算法，再加一个简单的两层神经网络。
本笔记用于记录学习 CMU10-414 过程，代码仅支持通过测试样例。

HW0 需要完成 7 个函数的实现，其中 Question 1 仅用于熟悉实验环境。接下来，记录其余 6 个函数的实现。

## Q2 parse_mnist

这个函数声明为 `parse_mnist(image_filename, label_filename)` ，返回值为一个元组 `(X, y)`，其中 `X` 为存储训练集图像数据的二维数组，`y` 为存储训练集标签的一维数组。

该函数用于读取 MNIST 训练数据集，数据集及其格式需参见 [lecun](https://web.archive.org/web/20220509025752/http://yann.lecun.com/exdb/mnist/)。MNIST 数据集主要分为训练集和测试集，在读取图像数据与标签时，需要特别注意[[fragment/mnist-format|其数据格式]]以正确读取。

具体实现中，需要使用 `gzip` 库读取数据文件，并且使用 `numpy` 创建符合题意的数据结构。

其代码实现如下：

```python
def parse_mnist(image_filename, label_filename):
    image_file_object = gzip.open(image_filename, "rb")
    label_file_object = gzip.open(label_filename, "rb")
    
    image_file_object.read(16)
    label_file_object.read(8)
    
    image_data = image_file_object.read()
    label_data = label_file_object.read()
    
    image_file_object.close()
    label_file_object.close()
    
    X = np.frombuffer(image_data, dtype=np.uint8).reshape(-1, 28 * 28).astype(np.float32)
    X = X / 255.0
    y = np.frombuffer(label_data, dtype=np.uint8)
    return X, y
```

## Q3 softmax_loss

题目已经给出了计算 loss 的公式，直接按照公式来就行：

$$\begin{equation}
\ell_{\mathrm{softmax}}(z, y) = \log\sum_{i=1}^k \exp z_i - z_y.
\end{equation}$$

这个函数声明为 `softmax_loss(Z, y)`，返回值为样本上的平均softmax损失。接收参数 `Z` 为一个形状为 (batch_size, num_classes) 的二维 numpy 数组，里面装着每个类别的 logit 预测值；接收参数 `y` 为形状为 (batch_size, ) 的一维 numpy 数组，包含每个样本的真实标签。

具体实现中，因为我们最终需要返回的是样本上的平均softmax损失，而公式给出的是单个样本loss的计算方式，因此我们需要逐行处理样本并取均值。

其代码实现如下：

```python
def softmax_loss(Z, y):
    rows = np.arange(Z.shape[0])
    return np.mean(np.log(np.sum(np.exp(Z), axis=1)) - Z[rows, y])
```

## Q4 softmax_regression_epoch



## 参考

1. 官方资源
   https://dlsyscourse.org/assignments/
2. 课程主页
   https://dlsyscourse.org/